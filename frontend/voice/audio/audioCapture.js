/**
 * Audio Capture Layer (16/24 kHz PCM)
 * Manages continuous microphone streams, Web Audio API energy analysis,
 * and per-turn MediaRecorder creation for 100% valid WebM headers on every speech turn.
 */
class AudioCapture {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.analyser = null;
        this.currentRecorder = null;
        this.currentTurnChunks = [];
        this.isCapturing = false;
        this.isRecordingTurn = false;
        this.sampleRate = 16000;
        this.mimeType = 'audio/webm';
    }

    async init() {
        if (this.audioContext && this.audioContext.state !== "closed") {
            return;
        }

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioCtx({ sampleRate: this.sampleRate });
        } catch (e) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioCtx();
        }
    }

    async startCapture() {
        if (this.isCapturing) return true;

        await this.init();
        if (this.audioContext && this.audioContext.state === "suspended") {
            try {
                await this.audioContext.resume();
            } catch (e) {
                // AudioContext resume might require user interaction; will resume on first interaction
            }
        }

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                }
            });

            // Set up AnalyserNode for continuous real-time energy & VAD monitoring
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.25;
            source.connect(this.analyser);

            this.mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            // Connect Silero AudioWorklet VAD if supported
            if (this.audioContext.audioWorklet) {
                try {
                    await this.audioContext.audioWorklet.addModule('/vad-processor.js');
                    this.vadWorkletNode = new AudioWorkletNode(this.audioContext, 'vad-processor');
                    source.connect(this.vadWorkletNode);
                    this.vadWorkletNode.port.onmessage = (event) => {
                        const { buffer } = event.data;
                        if (window.sttWorkerManager && window.sttWorkerManager.isReady) {
                            window.sttWorkerManager.sendAudio(buffer);
                        }
                    };
                } catch (workletErr) {
                    console.debug("[AudioCapture] AudioWorklet VAD not active:", workletErr);
                }
            }

            this.isCapturing = true;
            this.lastError = null;
            return true;
        } catch (err) {
            console.error("Audio capture failed to start:", err);
            this.isCapturing = false;
            this.lastError = err;
            return false;
        }
    }

    getEnergy() {
        if (!this.analyser || !this.isCapturing) return 0;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        return sum / bufferLength; // 0 to 255
    }

    /**
     * Called by TurnDetector when user speech starts.
     * Launches a fresh MediaRecorder instance so the turn audio has valid EBML/Opus headers.
     */
    startTurnRecording() {
        if (!this.mediaStream || this.isRecordingTurn) return;

        this.currentTurnChunks = [];
        try {
            this.currentRecorder = new MediaRecorder(this.mediaStream, { mimeType: this.mimeType });
            this.currentRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.currentTurnChunks.push(event.data);
                }
            };
            this.currentRecorder.start(100);
            this.isRecordingTurn = true;
        } catch (e) {
            console.error("Failed to start turn recorder:", e);
            this.isRecordingTurn = false;
        }
    }

    /**
     * Called by TurnDetector when user speech finishes (silence pause detected).
     * Stops the recorder and resolves with a fully-formed, valid audio blob.
     */
    stopTurnRecording() {
        return new Promise((resolve) => {
            if (!this.currentRecorder || !this.isRecordingTurn) {
                this.isRecordingTurn = false;
                return resolve(null);
            }

            const rec = this.currentRecorder;
            this.isRecordingTurn = false;
            this.currentRecorder = null;

            rec.onstop = () => {
                const blob = new Blob(this.currentTurnChunks, { type: this.mimeType });
                this.currentTurnChunks = [];
                resolve(blob);
            };

            try {
                if (rec.state !== "inactive") {
                    rec.stop();
                } else {
                    const blob = new Blob(this.currentTurnChunks, { type: this.mimeType });
                    this.currentTurnChunks = [];
                    resolve(blob);
                }
            } catch (e) {
                resolve(null);
            }
        });
    }

    cancelTurnRecording() {
        this.isRecordingTurn = false;
        if (this.currentRecorder && this.currentRecorder.state !== "inactive") {
            try { this.currentRecorder.stop(); } catch (e) {}
        }
        this.currentRecorder = null;
        this.currentTurnChunks = [];
    }

    stopCapture() {
        this.cancelTurnRecording();
        this.isCapturing = false;

        if (this.vadWorkletNode) {
            try { this.vadWorkletNode.disconnect(); } catch (e) {}
            this.vadWorkletNode = null;
        }

        if (window.sttWorkerManager) {
            window.sttWorkerManager.stop();
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioContext && this.audioContext.state !== "closed") {
            try { this.audioContext.close(); } catch (e) {}
            this.audioContext = null;
        }

        this.analyser = null;
    }
}

window.audioCapture = new AudioCapture();
