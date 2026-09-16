/**
 * VAD (Voice Activity Detection) & Turn Detector with Instant Barge-In
 * Detects speech/silence transitions, triggers instant TTS cutoff when user speaks,
 * and signals completed turns with 100% valid audio blobs.
 */
class TurnDetector {
    constructor() {
        this.state = "IDLE"; // IDLE, LISTENING, SPEECH_ACTIVE, PROCESSING
        this.speechThreshold = 20; // Calibrated sensitivity (ambient baseline is ~12-18, voice is ~30-80)
        this.silenceWindowMs = 450; // 450ms silence pause marks end of spoken turn
        this.minSpeechDurationMs = 80; // Detect short affirmations like "Yes" (~120-200ms)
        
        this.speechStartTime = 0;
        this.lastSpeechTime = 0;
        this.bargeInStartTime = 0;
        this.ambientNoise = 15;
        this.noiseSamples = 0;
        this.animationFrameId = null;
        this.isRunning = false;

        this.onSpeechStart = null;
        this.onTurnComplete = null;
        this.onBargeIn = null;
    }

    start(callbacks = {}) {
        if (this.isRunning) return;

        this.onSpeechStart = callbacks.onSpeechStart || null;
        this.onTurnComplete = callbacks.onTurnComplete || null;
        this.onBargeIn = callbacks.onBargeIn || null;

        this.state = "LISTENING";
        this.isRunning = true;
        this.speechStartTime = 0;
        this.lastSpeechTime = 0;
        this.bargeInStartTime = 0;
        this.ambientNoise = 15;
        this.noiseSamples = 0;

        const loop = () => {
            if (!this.isRunning) return;

            const energy = window.audioCapture ? window.audioCapture.getEnergy() : 0;
            const now = Date.now();

            // Calibrate ambient baseline during quiet periods
            if (this.noiseSamples < 50 && energy > 0 && energy < 30) {
                this.ambientNoise = (this.ambientNoise * this.noiseSamples + energy) / (this.noiseSamples + 1);
                this.noiseSamples++;
            }

            const effectiveThreshold = Math.max(this.speechThreshold, this.ambientNoise + 8);

            // Check if assistant is currently speaking via TTS (never use buggy speechSynthesis.speaking)
            const isAssistantSpeaking = Boolean(
                (window.speechSynthesisWrapper && window.speechSynthesisWrapper.isPlaying) ||
                (window.V && window.V.isSpeaking) ||
                (window.V && window.V.voice && window.V.voice.speaking)
            );

            // Time since speech synthesis finished
            const timeSinceSpeechEnd = now - (window.speechSynthesisWrapper?.speechEndTime || 0);
            const inSpeechCooldown = timeSinceSpeechEnd < 300; // 300ms echo buffer after TTS stops

            if (isAssistantSpeaking) {
                // While assistant is speaking, mute turn detection to prevent acoustic self-interruption from speakers.
                // Intentional user interruption is handled smoothly via Spacebar, the Stop button, or explicit "stop"/"cancel" voice commands.
                this.bargeInCount = 0;
                this.bargeInStartTime = 0;
                this.speechStartTime = 0;
                this.lastSpeechTime = 0;
                if (window.audioCapture && window.audioCapture.isRecordingTurn) {
                    window.audioCapture.cancelTurnRecording();
                }
                this.animationFrameId = requestAnimationFrame(loop);
                return;
            }

            // If assistant just finished speaking within last 300ms, ignore speaker tail/reverb
            if (inSpeechCooldown) {
                this.animationFrameId = requestAnimationFrame(loop);
                return;
            }

            // Normal user speech detection
            if (energy > effectiveThreshold) {
                if (this.speechStartTime === 0) {
                    this.speechStartTime = now;
                    // Immediately begin accumulating audio chunks so first syllable is preserved
                    if (window.audioCapture) {
                        window.audioCapture.startTurnRecording();
                    }
                }

                const speechDuration = now - this.speechStartTime;
                this.lastSpeechTime = now;

                if (speechDuration >= 100 && this.state !== "SPEECH_ACTIVE") {
                    this.state = "SPEECH_ACTIVE";
                    if (this.onSpeechStart) {
                        this.onSpeechStart();
                    }
                }
            } else {
                // Energy is below speech threshold
                if (this.state === "SPEECH_ACTIVE") {
                    const silenceDuration = now - this.lastSpeechTime;
                    const totalSpeechDuration = this.lastSpeechTime - this.speechStartTime;

                    if (silenceDuration > this.silenceWindowMs) {
                        if (totalSpeechDuration >= this.minSpeechDurationMs) {
                            this.state = "PROCESSING";
                            if (window.V && window.V.logEvent) {
                                window.V.logEvent("TURN_DETECTED", { totalSpeechDuration, silenceDuration });
                            }

                            if (window.audioCapture) {
                                window.audioCapture.stopTurnRecording().then((blob) => {
                                    if (blob && blob.size > 200 && this.onTurnComplete) {
                                        this.onTurnComplete(blob, totalSpeechDuration);
                                    } else {
                                        this.reset();
                                    }
                                });
                            }
                        } else {
                            // Too short -> discard
                            if (window.audioCapture) {
                                window.audioCapture.cancelTurnRecording();
                            }
                            this.state = "LISTENING";
                        }

                        this.speechStartTime = 0;
                        this.lastSpeechTime = 0;
                    }
                } else {
                    // Reset false trigger if user did not continue speaking
                    if (this.speechStartTime !== 0 && (now - this.speechStartTime > 250)) {
                        this.speechStartTime = 0;
                        if (window.audioCapture) {
                            window.audioCapture.cancelTurnRecording();
                        }
                    }
                }
            }

            this.animationFrameId = requestAnimationFrame(loop);
        };

        this.animationFrameId = requestAnimationFrame(loop);
    }

    reset() {
        this.state = "LISTENING";
        this.speechStartTime = 0;
        this.lastSpeechTime = 0;
        this.bargeInStartTime = 0;
        if (window.audioCapture) {
            window.audioCapture.cancelTurnRecording();
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (window.audioCapture) {
            window.audioCapture.cancelTurnRecording();
        }
        this.state = "IDLE";
    }
}

window.turnDetector = new TurnDetector();
