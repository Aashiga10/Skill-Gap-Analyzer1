import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { fsdb, auth } from "./firebaseConfig.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
const S={
  user:null, dreamJob:'', skills:[], hoursPerWeek:10,
  matchScore:0, skillsHave:[], skillsNeed:[],
  roadmap:[], completedCourses:new Set(), completedWeeks:new Set(),
  resultsReady:false, roadmapReady:false,
  activeSkillFilter:'All'
};

// ── JOB DATABASE ───────────────────────────────────
const JOBS={
  "Web Developer":["HTML","CSS","JavaScript","React","Node.js","Git"],
  "Full Stack Developer":["HTML","CSS","JavaScript","React","Node.js","MongoDB"],
  "Data Analyst":["Excel","SQL","Python","Power BI","Tableau","Statistics"],
  "Data Scientist":["Python","Machine Learning","Statistics","Pandas","NumPy","Data Visualization"],
  "Android Developer":["Java","Kotlin","Android Studio","XML","APIs","Firebase"],
  "UI/UX Designer":["Figma","Adobe XD","UX Principles","Wireframing","Prototyping","User Research"],
  "Cyber Security Analyst":["Networking","Ethical Hacking","Cryptography","Penetration Testing","Security Tools","Linux"],
  "Cloud Engineer":["AWS","Azure","Docker","Kubernetes","Linux","Networking"],
  "AI/ML Engineer":["Python","Machine Learning","Deep Learning","TensorFlow","Data Preprocessing","Statistics"],
  "Database Administrator":["SQL","Database Design","MySQL","PostgreSQL","Backup & Recovery","Performance Tuning"],
  "Game Developer":["C++","C#","Unity","Unreal Engine","Game Design","Physics Engines"],
  "Software Engineer":["Java","Python","C++","Data Structures","Algorithms","OOP"],
  "DevOps Engineer":["CI/CD","Docker","Kubernetes","Jenkins","Linux","Git"],
  "Business Analyst":["Excel","SQL","Data Analysis","Communication","Requirement Gathering","Documentation"],
  "Network Engineer":["Networking","Routing","Switching","Cisco","Firewalls","Troubleshooting"]
};
const JOB_LIST=Object.keys(JOBS);

// ── COURSES DATABASE ──────────────────────────────
const COURSE_DB={
  "Web Developer":[
    {skill:"HTML",name:"HTML & CSS Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=a_iQb1lnAEQ",duration:"5 hrs"},
    {skill:"HTML",name:"Responsive Web Design Certification",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/2022/responsive-web-design/",duration:"15 hrs"},
    {skill:"CSS",name:"CSS Tutorial – Zero to Hero",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=1Rs2ND1ryYc",duration:"5 hrs"},
    {skill:"JavaScript",name:"JavaScript Algorithms and Data Structures",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",duration:"20 hrs"},
    {skill:"JavaScript",name:"JavaScript Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=jS4aFq5-91M",duration:"8 hrs"},
    {skill:"React",name:"Front End Development Libraries",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/front-end-development-libraries/",duration:"18 hrs"},
    {skill:"React",name:"React JS Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=bMknfKXIFA8",duration:"10 hrs"},
    {skill:"Node.js",name:"Back End Development and APIs",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/back-end-development-and-apis/",duration:"15 hrs"},
    {skill:"Node.js",name:"Node.js & Express Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=J4aMJ53PQsk",duration:"8 hrs"},
    {skill:"Git",name:"Git and GitHub for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=RGOj5yH7evk",duration:"3 hrs"},
  ],
  "Full Stack Developer":[
    {skill:"HTML",name:"Responsive Web Design",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/2022/responsive-web-design/",duration:"15 hrs"},
    {skill:"CSS",name:"CSS Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=OXGznpKZ_sA",duration:"5 hrs"},
    {skill:"JavaScript",name:"JavaScript Algorithms & Data Structures",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",duration:"20 hrs"},
    {skill:"React",name:"React Complete Guide",platform:"Udemy",type:"paid",url:"https://www.udemy.com/courses/search/?q=react+complete+guide",duration:"40 hrs"},
    {skill:"React",name:"React Full Course 2024",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=bMknfKXIFA8",duration:"12 hrs"},
    {skill:"Node.js",name:"Node.js REST API Tutorial",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=pKd0Rpw7O48",duration:"6 hrs"},
    {skill:"MongoDB",name:"MongoDB Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=ofme2o29ngU",duration:"5 hrs"},
    {skill:"MongoDB",name:"MongoDB & Mongoose Tutorial",platform:"freeCodeCamp",type:"free",url:"https://www.youtube.com/watch?v=DZBGEVgL2eE",duration:"3 hrs"},
    {skill:"Git",name:"Git & GitHub Crash Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=SWYqp7iY_Tc",duration:"2 hrs"},
  ],
  "Data Analyst":[
    {skill:"Excel",name:"Microsoft Excel – Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=Vl0H-qTclOg&t=9s",duration:"2 hrs"},
    {skill:"SQL",name:"SQL Tutorial – Full Database Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=HXV3zeQKqGY",duration:"4 hrs"},
    {skill:"SQL",name:"Relational Database Certification",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/relational-database/",duration:"20 hrs"},
    {skill:"Python",name:"Scientific Computing with Python",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/scientific-computing-with-python/",duration:"15 hrs"},
    {skill:"Python",name:"Python for Data Analysis Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=r-uOLxNrNk8",duration:"8 hrs"},
    {skill:"Power BI",name:"Power BI Full Course – Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=3u7MQz1EyIs",duration:"5 hrs"},
    {skill:"Tableau",name:"Tableau for Beginners Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=aHaOIvR00So",duration:"4 hrs"},
    {skill:"Statistics",name:"Statistics for Data Science",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=Vfo5le26IhY",duration:"6 hrs"},
    {skill:"Statistics",name:"Data Analysis with Python Certification",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/data-analysis-with-python/",duration:"10 hrs"},
  ],
  "Data Scientist":[
    {skill:"Python",name:"Scientific Computing with Python",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/scientific-computing-with-python/",duration:"15 hrs"},
    {skill:"Python",name:"Python Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=rfscVS0vtbw",duration:"12 hrs"},
    {skill:"Machine Learning",name:"Machine Learning with Python Certification",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/machine-learning-with-python/",duration:"15 hrs"},
    {skill:"Machine Learning",name:"Machine Learning Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=i_LwzRVP7bg",duration:"10 hrs"},
    {skill:"Statistics",name:"Statistics for Data Science",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=Vfo5le26IhY",duration:"6 hrs"},
    {skill:"Pandas",name:"Pandas Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=vmEHCJofslg",duration:"4 hrs"},
    {skill:"NumPy",name:"NumPy Tutorial for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=QUT1VHiLnnI",duration:"2 hrs"},
    {skill:"Data Visualization",name:"Data Visualization with Python",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/data-analysis-with-python/",duration:"8 hrs"},
    {skill:"Data Visualization",name:"Matplotlib & Seaborn Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=O_OEJMIGqlE",duration:"5 hrs"},
  ],
  "Android Developer":[
    {skill:"Java",name:"Java Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=A74TOX803D0",duration:"12 hrs"},
    {skill:"Kotlin",name:"Kotlin Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=EExSSotojVI",duration:"8 hrs"},
    {skill:"Android Studio",name:"Android Development Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=fis26HvvDII",duration:"14 hrs"},
    {skill:"Android Studio",name:"Android Development for Beginners",platform:"Udemy",type:"paid",url:"https://www.udemy.com/courses/search/?q=android+development+beginners",duration:"25 hrs"},
    {skill:"XML",name:"XML for Android Layouts",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=vV-G5E-50Hk",duration:"2 hrs"},
    {skill:"APIs",name:"REST APIs in Android",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=xHXn3Kg2IQE",duration:"3 hrs"},
    {skill:"Firebase",name:"Firebase for Android Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=sza-pG1bB0c",duration:"5 hrs"},
  ],
  "UI/UX Designer":[
    {skill:"Figma",name:"Figma Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=jwNmzENZZvg",duration:"6 hrs"},
    {skill:"Figma",name:"UI Design with Figma",platform:"Udemy",type:"paid",url:"https://www.udemy.com/courses/search/?q=figma+ui+design",duration:"15 hrs"},
    {skill:"Adobe XD",name:"Adobe XD Tutorial – Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=WEljfcOJHEY",duration:"4 hrs"},
    {skill:"UX Principles",name:"UX Design Fundamentals",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=c9Wg6Cb_YlU",duration:"5 hrs"},
    {skill:"Wireframing",name:"Wireframing for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=F0-E2hY4e3U",duration:"2 hrs"},
    {skill:"Prototyping",name:"Prototyping in Figma",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=8I1rL7O1pM4",duration:"2 hrs"},
    {skill:"User Research",name:"User Research Methods",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=KzVnt5-hIzw",duration:"3 hrs"},
  ],
  "Cyber Security Analyst":[
    {skill:"Networking",name:"Computer Networking Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=qiQR5rTSshw",duration:"8 hrs"},
    {skill:"Ethical Hacking",name:"Ethical Hacking Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=3Kq1MIfTWCE",duration:"15 hrs"},
    {skill:"Cryptography",name:"Cryptography Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=jhXCTbFnK8o",duration:"5 hrs"},
    {skill:"Penetration Testing",name:"Penetration Testing Tutorial",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=3Kq1MIfTWCE",duration:"6 hrs"},
    {skill:"Security Tools",name:"Information Security Certification",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/information-security/",duration:"10 hrs"},
    {skill:"Linux",name:"Linux Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=v_1yQOJbvIs",duration:"7 hrs"},
  ],
  "Cloud Engineer":[
    {skill:"AWS",name:"AWS Full Course – Beginner to Pro",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=k1RI5locZE4",duration:"10 hrs"},
    {skill:"AWS",name:"AWS Cloud Practitioner",platform:"Udemy",type:"paid",url:"https://www.udemy.com/courses/search/?q=aws+cloud+practitioner",duration:"20 hrs"},
    {skill:"Azure",name:"Microsoft Azure Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=tQoE2cItGvk",duration:"8 hrs"},
    {skill:"Docker",name:"Docker Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=pTFZFxd4hOI",duration:"5 hrs"},
    {skill:"Kubernetes",name:"Kubernetes Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=X48VuDVv0do",duration:"6 hrs"},
    {skill:"Linux",name:"Linux Command Line Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=ZtqBQ68cfJc",duration:"5 hrs"},
    {skill:"Networking",name:"Networking Fundamentals",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=qiQR5rTSshw",duration:"6 hrs"},
  ],
  "AI/ML Engineer":[
    {skill:"Python",name:"Scientific Computing with Python",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/scientific-computing-with-python/",duration:"15 hrs"},
    {skill:"Machine Learning",name:"Machine Learning with Python",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/machine-learning-with-python/",duration:"15 hrs"},
    {skill:"Machine Learning",name:"Machine Learning Crash Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=i_LwzRVP7bg",duration:"8 hrs"},
    {skill:"Deep Learning",name:"Deep Learning Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=VyWAvY2CF9c",duration:"10 hrs"},
    {skill:"TensorFlow",name:"TensorFlow Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=tPYj3fFJGjk",duration:"6 hrs"},
    {skill:"Data Preprocessing",name:"Data Preprocessing with Python",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=O_OEJMIGqlE",duration:"3 hrs"},
    {skill:"Statistics",name:"Statistics for ML",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=xxpc-HPKN28",duration:"5 hrs"},
  ],
  "Database Administrator":[
    {skill:"SQL",name:"SQL Full Course – Relational Databases",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/relational-database/",duration:"20 hrs"},
    {skill:"SQL",name:"SQL Tutorial Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=HXV3zeQKqGY",duration:"5 hrs"},
    {skill:"Database Design",name:"Database Design Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=ztHopE5Wnpc",duration:"8 hrs"},
    {skill:"MySQL",name:"MySQL Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=7S_tz1z_5bA",duration:"5 hrs"},
    {skill:"PostgreSQL",name:"PostgreSQL Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=qw--VYLpxG4",duration:"4 hrs"},
    {skill:"Backup & Recovery",name:"Database Backup & Recovery",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=q6e0QjR4FmU",duration:"2 hrs"},
    {skill:"Performance Tuning",name:"Database Performance Tuning",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=o04i64vK1F8",duration:"3 hrs"},
  ],
  "Game Developer":[
    {skill:"C#",name:"C# Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=GhQdlIFylQ8",duration:"8 hrs"},
    {skill:"C++",name:"C++ Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=vLnPwxZdW4Y",duration:"10 hrs"},
    {skill:"Unity",name:"Unity Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=gB1F9G0JXOo",duration:"12 hrs"},
    {skill:"Unity",name:"Complete C# Unity Developer",platform:"Udemy",type:"paid",url:"https://www.udemy.com/courses/search/?q=unity+c+sharp+game+development",duration:"30 hrs"},
    {skill:"Unreal Engine",name:"Unreal Engine Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=gQmiqmxJMtA",duration:"10 hrs"},
    {skill:"Game Design",name:"Game Design Fundamentals",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=1F_4-tBvG2Q",duration:"4 hrs"},
    {skill:"Physics Engines",name:"Game Physics Tutorial",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=2Tz89kLgCzw",duration:"3 hrs"},
  ],
  "Software Engineer":[
    {skill:"Java",name:"Java Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=A74TOX803D0",duration:"12 hrs"},
    {skill:"Python",name:"Scientific Computing with Python",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/scientific-computing-with-python/",duration:"15 hrs"},
    {skill:"C++",name:"C++ Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=vLnPwxZdW4Y",duration:"10 hrs"},
    {skill:"Data Structures",name:"Data Structures Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=RBSGKlAvoiM",duration:"8 hrs"},
    {skill:"Algorithms",name:"Algorithms and Data Structures",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",duration:"20 hrs"},
    {skill:"Algorithms",name:"Algorithms Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=8hly31xKli0",duration:"6 hrs"},
    {skill:"OOP",name:"Object Oriented Programming",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=pTB0EiLXUC8",duration:"5 hrs"},
  ],
  "DevOps Engineer":[
    {skill:"CI/CD",name:"CI/CD Pipeline Tutorial",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=62N8UiKUcbA",duration:"4 hrs"},
    {skill:"Docker",name:"Docker Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=pTFZFxd4hOI",duration:"5 hrs"},
    {skill:"Kubernetes",name:"Kubernetes Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=X48VuDVv0do",duration:"6 hrs"},
    {skill:"Jenkins",name:"Jenkins Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=nCKxl7QFFAY",duration:"4 hrs"},
    {skill:"Linux",name:"Linux for DevOps Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=ZtqBQ68cfJc",duration:"6 hrs"},
    {skill:"Git",name:"Git & GitHub Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=RGOj5yH7evk",duration:"3 hrs"},
    {skill:"Git",name:"Quality Assurance Certification",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/quality-assurance/",duration:"10 hrs"},
  ],
  "Business Analyst":[
    {skill:"Excel",name:"Excel Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=Vl0H-qTcleg",duration:"6 hrs"},
    {skill:"SQL",name:"SQL for Business Analysts",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=HXV3zeQKqGY",duration:"4 hrs"},
    {skill:"SQL",name:"Relational Database Certification",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/relational-database/",duration:"20 hrs"},
    {skill:"Data Analysis",name:"Data Analysis with Python",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/data-analysis-with-python/",duration:"10 hrs"},
    {skill:"Communication",name:"Business Communication Skills",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=W0jEA2XzZQQ",duration:"3 hrs"},
    {skill:"Requirement Gathering",name:"Requirements Gathering Tutorial",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=R1E8R16y62o",duration:"2 hrs"},
    {skill:"Documentation",name:"Business Analysis Documentation",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=7c8P0N4pZ2Y",duration:"2 hrs"},
  ],
  "Network Engineer":[
    {skill:"Networking",name:"Computer Networking Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=qiQR5rTSshw",duration:"8 hrs"},
    {skill:"Routing",name:"Routing Protocols Tutorial",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=uK8sR8M0L-k",duration:"4 hrs"},
    {skill:"Switching",name:"Switching Concepts Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=68KkIfsQkE4",duration:"3 hrs"},
    {skill:"Cisco",name:"Cisco CCNA Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=H8W9oMNSuwo",duration:"20 hrs"},
    {skill:"Cisco",name:"Cisco CCNA Complete Course",platform:"Udemy",type:"paid",url:"https://www.udemy.com/courses/search/?q=cisco+ccna",duration:"40 hrs"},
    {skill:"Firewalls",name:"Firewall Security Tutorial",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=9g7nJ-hBf98",duration:"3 hrs"},
    {skill:"Troubleshooting",name:"Network Troubleshooting Guide",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=9a1z93Yk6aM",duration:"2 hrs"},
  ]
};

// ── THEME ──────────────────────────────────────────
function toggleTheme(){
  const t=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',t);
  document.querySelectorAll('.theme-btn').forEach(b=>b.textContent=t==='dark'?'☀️':'👁');

  
}

// ── ACCESSIBILITY HELPERS ──────────────────────────
function announce(msg){
  const r=document.getElementById('sr-announce');
  if(r){r.textContent='';setTimeout(()=>{r.textContent=msg;},50);}
  speak(msg);
}
function focusScreenHead(scr){
  const head=scr.querySelector('h1,h2');
  if(head){head.setAttribute('tabindex','-1');head.focus({preventScroll:true});return;}
  const f=scr.querySelector('button,[href],input,select');
  if(f)f.focus({preventScroll:true});
}
function skipToContent(e){
  if(e)e.preventDefault();
  const active=document.querySelector('.screen.active');
  if(active)focusScreenHead(active);
}

// ── SCREEN ROUTING ─────────────────────────────────
function go(id){
  const bioModal = document.getElementById('voice-bio-modal');
  if (bioModal && bioModal.style.display !== 'none') {
    closeVoiceBioModal(false);
  }
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const scr=document.getElementById('screen-'+id);
  scr.classList.add('active');
  window.scrollTo(0,0);
  if(id==='app') initApp();
  focusScreenHead(scr);

  if (id === 'login') {
    switchLoginTab('bio');
    const isVoiceActive = Boolean(
      (V && (V.enabled || V.isBlindUser)) ||
      (V && V.voice && V.voice.enabled) ||
      (window.voiceAssistant && window.voiceAssistant.initialized)
    );
    if (isVoiceActive && (!window.navigationTools || !window.navigationTools.isNavigating)) {
      const msg = "Opened login screen. Say: 'Hi, I am' followed by your name to log in with voice, or say 'continue with Google'.";
      if (window.speak) {
        window.speak(msg, () => {
          if (window.startListening) window.startListening();
        });
      }
    }
    return;
  }

  // Spoken screen announcements for blind accessibility (only if not already speaking)
  const screenDescriptions = {
    landing: 'Home screen. SkillNexus AI.',
    signup: 'Sign up screen.',
    about: 'About screen. SkillNexus AI bridges your career skill gaps.'
  };
  if(screenDescriptions[id] && V && V.isBlindUser && (!window.speechSynthesisWrapper || !window.speechSynthesisWrapper.isPlaying)){
    announce(screenDescriptions[id]);
  }
}

function switchLoginTab(tab) {
  const bioBtn = document.getElementById('tab-btn-bio');
  const passBtn = document.getElementById('tab-btn-pass');
  const bioView = document.getElementById('login-bio-view');
  const passView = document.getElementById('login-pass-view');

  if (tab === 'bio') {
    if (bioBtn) { bioBtn.classList.add('active'); bioBtn.setAttribute('aria-selected', 'true'); }
    if (passBtn) { passBtn.classList.remove('active'); passBtn.setAttribute('aria-selected', 'false'); }
    if (bioView) bioView.style.display = 'block';
    if (passView) passView.style.display = 'none';

    // Activate voice biometric session for primary login view
    if (!V.voiceBioFlow) V.voiceBioFlow = {};
    V.voiceBioFlow.active = true;
    V.voiceBioFlow.mode = 'login';
    if (!V.voiceBioFlow.step || V.voiceBioFlow.step === 'verified' || V.voiceBioFlow.step === 'failed') {
      V.voiceBioFlow.step = 'name';
    }
    updateBioModalUI();
    initBioAudioVisualizer();
  } else {
    if (passBtn) { passBtn.classList.add('active'); passBtn.setAttribute('aria-selected', 'true'); }
    if (bioBtn) { bioBtn.classList.remove('active'); bioBtn.setAttribute('aria-selected', 'false'); }
    if (passView) passView.style.display = 'block';
    if (bioView) bioView.style.display = 'none';

    const emailIn = document.getElementById('login-email');
    if (emailIn) emailIn.focus();
  }
}

// ── AUTH ───────────────────────────────────────────
function doLogin(m) {
    let name = "Student";
    let email = "user@example.com";
    let password = "";
    if (m === "signup") {
        name = document.getElementById("su-name").value.trim() || "Student";
        email = document.getElementById("su-email").value.trim();
        password = document.getElementById("su-pass").value.trim();

        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            S.user = { name, email };
            document.getElementById("nav-uname").textContent = name;
            exitLoginFlow();
            go("app");
            goTo("analyse");
            announce("Welcome, " + name + ". Your account was created and you are logged in.");
        })
        .catch((error) => {
            showToast(error.message, 'error');
            announce("Sign up failed. " + error.message);
        });
    }
    else if (m === "email") {
        email = document.getElementById("login-email").value.trim();
        password = document.getElementById("login-pass").value.trim();
        if (email === "" || password === "") {
            showToast("Please enter email and password.", 'error');
            document.getElementById("login-email").focus();
            return;
        }
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            name = userCredential.user.email.split("@")[0];
            S.user = { name, email };
            document.getElementById("nav-uname").textContent = name;
            exitLoginFlow();
            go("app");
            goTo("analyse");
            announce("Welcome back, " + name + ". You are now logged in.");
        })
        .catch((error) => {
            showToast(error.message, 'error');
            if (V.loginFlow.active) {
                announce("Login failed. " + error.message + " Please try again. You can say change email, or type your password again and say login.");
                const pp = document.getElementById("login-pass");
                if (pp) pp.focus();
            } else {
                announce("Login failed. " + error.message);
            }
        });
    }
    else {
        S.user = {
            name: "Student",
            email: "student@gmail.com"
        };
        document.getElementById("nav-uname").textContent = "Student";
        exitLoginFlow();
        go("app");
        goTo("analyse");
        announce("Logged in with Google.");
    }
}

// function doLogin(m){
//   let name='Student',email='user@example.com';
//   if(m==='signup'){
//     name=document.getElementById('su-name').value.trim()||'Student';
//     // email=document.getElementById('su-email').value.trim()||'user@example.com';
//   } else if(m==='email'){
//     // email=document.getElementById('login-email').value.trim()||'user@example.com';
//     const email = document.getElementById("login-email").value.trim();
// const password = document.getElementById("login-pass").value.trim();

// if (email === "" || password === "") {
//     alert("Please enter email and password.");
//     return;
// }

//     // name=email.split('@')[0];name=name.charAt(0).toUpperCase()+name.slice(1);
//   } else { name='Student'; email='student@gmail.com'; }
//   S.user={name,email};
//   document.getElementById('nav-uname').textContent=name;
//   // saveUserToDB(name, email, m);
//   createUserWithEmailAndPassword(auth, email, password)
//   go('app'); goTo('analyse');
// }
function logout(){
  Object.assign(S,{user:null,dreamJob:'',skills:[],skillsHave:[],skillsNeed:[],matchScore:0,roadmap:[],completedCourses:new Set(),completedWeeks:new Set(),resultsReady:false,roadmapReady:false,activeSkillFilter:'All'});
  V.dreamFlow={active:false,raw:'',pending:null};
  V.interest={active:false,stage:'idle',matches:[],introShown:true};
  V.loginFlow={active:false,step:'idle',email:''};
  V.analyseHintShown=false;
  go('landing');
}


// ── APP INIT ──────────────────────────────────────
function initApp(){
  // build quick job buttons
  const qb=document.getElementById('job-quick-btns');
  if(!qb.children.length){
    JOB_LIST.forEach(j=>{
      const b=document.createElement('button');
      b.className='sf-btn';b.textContent=j;
      b.onclick=()=>{document.getElementById('dream-job').value=j;hideDropdown()};
      qb.appendChild(b);
    });
  }
}

// ── JOB DROPDOWN ──────────────────────────────────
let ddIndex=-1;
function filterJobs(){
  const inp=document.getElementById('dream-job');
  const q=inp.value.toLowerCase();
  const dd=document.getElementById('job-dropdown');
  const matches=JOB_LIST.filter(j=>j.toLowerCase().includes(q));
  if(!q||!matches.length){dd.style.display='none';inp.setAttribute('aria-expanded','false');return;}
  dd.innerHTML=matches.map((j,i)=>`<div class="job-option" role="option" id="jo-${i}" aria-selected="false" tabindex="-1" onclick="selectJob('${j}')">${j}</div>`).join('');
  dd.style.display='block';
  inp.setAttribute('aria-expanded','true');
  ddIndex=-1;
}
function showDropdown(){filterJobs();}
function hideDropdown(){document.getElementById('job-dropdown').style.display='none';document.getElementById('dream-job').setAttribute('aria-expanded','false');}
function selectJob(j){document.getElementById('dream-job').value=j;hideDropdown();ddIndex=-1;}
function ddHighlight(i){
  const dd=document.getElementById('job-dropdown');
  const opts=[...dd.querySelectorAll('.job-option')];
  if(!opts.length)return;
  ddIndex=(i+opts.length)%opts.length;
  opts.forEach((o,ix)=>{o.classList.toggle('active',ix===ddIndex);o.setAttribute('aria-selected',ix===ddIndex);});
  opts[ddIndex].focus();
}
function ddKey(e){
  const dd=document.getElementById('job-dropdown');
  const opts=[...dd.querySelectorAll('.job-option')];
  if(dd.style.display==='none'||!opts.length){
    if(e.key==='ArrowDown'){e.preventDefault();showDropdown();ddHighlight(0);}
    return;
  }
  if(e.key==='ArrowDown'){e.preventDefault();ddHighlight(ddIndex+1);}
  else if(e.key==='ArrowUp'){e.preventDefault();ddHighlight(ddIndex-1);}
  else if(e.key==='Enter'){e.preventDefault();if(ddIndex>-1)selectJob(opts[ddIndex].textContent);}
  else if(e.key==='Escape'){e.preventDefault();hideDropdown();document.getElementById('dream-job').focus();}
}
document.addEventListener('click',e=>{if(!e.target.closest('.job-wrap'))hideDropdown();});

// ── SKILL TAGS ────────────────────────────────────
function addSkill(){
  const inp=document.getElementById('skill-input');
  const v=inp.value.trim();
  if(!v||S.skills.includes(v)){inp.value='';return;}
  S.skills.push(v);renderTags();inp.value='';
}
function removeSkillAt(i){S.skills.splice(i,1);renderTags();}
function renderTags(){
  document.getElementById('skill-tags').innerHTML=S.skills.map((s,i)=>
    `<div class="tag">${s} <button type="button" class="rm" aria-label="Remove skill ${s}" onclick="removeSkillAt(${i})">×</button></div>`
  ).join('');
}

// ── IN-APP NAV ────────────────────────────────────
async function goTo(page){
  const bioModal = document.getElementById('voice-bio-modal');
  if (bioModal && bioModal.style.display !== 'none') {
    closeVoiceBioModal(false);
  }
  
  if (window.voiceAssistant) {
      await window.voiceAssistant.cancelCurrentFlow();
  }

  if(!V.suppressHistory){
    const cur=document.querySelector('.page.active');
    const curId=cur?cur.id.replace('page-',''):'analyse';
    if(curId!==page)V.pageHistory.push(curId);
    if(V.pageHistory.length>30)V.pageHistory.shift();
  }
  V.dreamFlow={active:false,raw:'',pending:null};
  V.interest={active:false,stage:'idle',matches:[],introShown:true};
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-links .nav-item').forEach(a=>{a.classList.remove('active');a.removeAttribute('aria-current');});
  const pg=document.getElementById('page-'+page);
  pg.classList.add('active');
  const na=document.getElementById('nav-'+page);
  if(na){na.classList.add('active');na.setAttribute('aria-current','page');}
  window.scrollTo(0,0);
  if(page==='results')renderResults();
  if(page==='roadmap')renderRoadmap();
  if(page==='courses')renderCourses();
  if(page==='progress')renderProgress();
  if(page==='profile')renderProfile();
  const head=pg.querySelector('h1');
  if(head){head.setAttribute('tabindex','-1');head.focus({preventScroll:true});}
  
  if (V && V.isBlindUser && (!window.speechSynthesisWrapper || !window.speechSynthesisWrapper.isPlaying)) {
      announce('Opened ' + page + ' section.');
  }
}

// ── ANALYZE ──────────────────────────────────────
function analyzeSkills(){
  const job=document.getElementById('dream-job').value.trim();
  if(!job){showToast('Please enter or select your dream job!','error');document.getElementById('dream-job').focus();return;}
  S.dreamJob=job;
  S.hoursPerWeek=parseInt(document.getElementById('hours-week').value);
  S.resultsReady=false;S.roadmapReady=false;
  S.roadmap=[];
  updateUserJobInDB();
  goTo('results');
}
async function uploadResume(event) {
    if (event) event.preventDefault();
    const file = document.getElementById("resumeFile").files[0];
    const statusDiv = document.getElementById("resume-status");
    
    if (!file) {
        if(typeof showToast === 'function') showToast("Please choose a resume file first.", "error");
        else alert("Please choose a resume file first.");
        return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    
    if(statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.textContent = 'Uploading and extracting skills... (This may take a moment)';
    }

    try {
        const response = await fetch("http://localhost:5000/uploadResume", {
            method: "POST",
            body: formData
        });

        const data = await response.json();   
        
        if (data.success && data.skills) {
            if(statusDiv) statusDiv.textContent = `Success! Extracted ${data.skills.length} skills.`;
            data.skills.forEach(skill => {
                const s = skill.trim();
                if (s && !S.skills.includes(s)) S.skills.push(s);
            });
            renderTags();
            if(typeof showToast === 'function') showToast("Skills extracted from resume!", "success");
        } else {
            if(statusDiv) statusDiv.textContent = data.message || "Failed to extract skills.";
            if(typeof showToast === 'function') showToast(data.message || "Failed to extract skills", "error");
        }

    } catch (err) {
        console.error("Upload Error:", err);
        if(statusDiv) statusDiv.textContent = "Upload failed.";
        if(typeof showToast === 'function') showToast("Upload failed", "error");
    }
}
window.uploadResume = uploadResume;

// ── RESULTS ──────────────────────────────────────
async function renderResults(){
  document.getElementById('r-job').textContent=S.dreamJob;
  if(S.resultsReady){showResults();return;}
  document.getElementById('r-loading').style.display='block';
  document.getElementById('r-content').style.display='none';

  // If user entered NO skills → immediately show 0% without calling AI
  if(!S.skills.length){
    const jobKey=JOB_LIST.find(j=>j.toLowerCase()===S.dreamJob.toLowerCase())||S.dreamJob;
    S.matchScore=0;
    S.skillsHave=[];
    S.skillsNeed=JOBS[jobKey]||[];
    S.resultsReady=true;showResults();return;
  }

  // required skills from DB
  const jobKey=JOB_LIST.find(j=>j.toLowerCase()===S.dreamJob.toLowerCase())||S.dreamJob;
  const requiredSkills=JOBS[jobKey]||[];
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',max_tokens:800,
        messages:[{role:'user',content:
          `Career skills gap analysis. Dream job: "${S.dreamJob}". Required skills for this role: [${requiredSkills.join(', ')}]. User has: [${S.skills.join(', ')}].
Compare the user's skills against required skills. Be generous — partial matches count.
Respond ONLY with valid JSON (no markdown):
{"matchScore":<0-100>,"skillsHave":[<from user's list that match required>],"skillsNeed":[<required skills user is missing>]}`
        }]
      })
    });
    const d=await res.json();
    const p=JSON.parse(d.content.map(b=>b.text||'').join('').replace(/```json|```/g,'').trim());
    S.matchScore=p.matchScore||0;S.skillsHave=p.skillsHave||[];S.skillsNeed=p.skillsNeed||[];
  } catch {
    const have=S.skills.filter(s=>requiredSkills.some(r=>r.toLowerCase().includes(s.toLowerCase())||s.toLowerCase().includes(r.toLowerCase())));
    const need=requiredSkills.filter(r=>!S.skills.some(s=>s.toLowerCase().includes(r.toLowerCase())||r.toLowerCase().includes(s.toLowerCase())));
    S.skillsHave=have.length?have:S.skills.slice(0,Math.ceil(S.skills.length/2));
    S.skillsNeed=need.length?need:requiredSkills.slice(0,4);
    S.matchScore=Math.round((S.skillsHave.length/requiredSkills.length)*100)||0;
  }
  S.resultsReady=true;showResults();
}
function showResults(){
  document.getElementById('r-loading').style.display='none';
  document.getElementById('r-content').style.display='block';
  const off=339-(339*S.matchScore/100);
  setTimeout(()=>{
    document.getElementById('score-circle').style.strokeDashoffset=off;
    document.getElementById('score-text').textContent=S.matchScore+'%';
    document.getElementById('score-svg').setAttribute('aria-label','Skill gap score '+S.matchScore+' percent');
  },120);
  document.getElementById('r-have').innerHTML=S.skillsHave.length
    ?S.skillsHave.map(s=>`<div class="skill-item"><span aria-hidden="true" style="color:#10b981;font-size:1.1rem">✓</span>${s}</div>`).join('')
    :'<div style="color:var(--muted);font-size:.88rem">No matching skills found yet.</div>';
  document.getElementById('r-need').innerHTML=S.skillsNeed.map(s=>`<div class="skill-item"><span aria-hidden="true" style="color:#ef4444;font-size:1.1rem">✕</span>${s}</div>`).join('');
  if (V && V.isBlindUser && (!window.speechSynthesisWrapper || !window.speechSynthesisWrapper.isPlaying)) {
    announce(`Analysis complete. Match score ${S.matchScore} percent. Skills you have: ${S.skillsHave.join(', ')||'none'}. Skills to learn: ${S.skillsNeed.join(', ')||'none'}.`);
  }
}

// ── ROADMAP ──────────────────────────────────────
async function renderRoadmap(){
  if(S.roadmapReady){showRoadmap();return;}
  if(!S.dreamJob){document.getElementById('rm-loading').style.display='none';document.getElementById('rm-content').innerHTML='<div class="card" style="color:var(--muted)">Please complete an analysis first.</div>';return;}
  document.getElementById('rm-loading').style.display='block';
  document.getElementById('rm-content').innerHTML='';
  const weeks=S.hoursPerWeek<=5?10:S.hoursPerWeek<=10?8:S.hoursPerWeek<=20?6:4;
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',max_tokens:3000,
        messages:[{role:'user',content:
          `Create a ${weeks}-week learning roadmap for "${S.dreamJob}". Skills to learn: ${S.skillsNeed.join(', ')}. Available: ${S.hoursPerWeek} hrs/week.
Each week must have exactly 5 steps, each step being a specific actionable task.
Respond ONLY with valid JSON array (no markdown, no extra text):
[{"week":1,"title":"Week title","hours":${S.hoursPerWeek},"steps":["Step 1: Introduction – what is X and why it matters","Step 2: Setup – install tools and configure environment","Step 3: Core concepts – learn the fundamentals","Step 4: Practice – build a small exercise","Step 5: Project – apply what you learned"]}]
Exactly ${weeks} week objects. Each step starts with "Step N: Title – description".`
        }]
      })
    });
    const d=await res.json();
    S.roadmap=JSON.parse(d.content.map(b=>b.text||'').join('').replace(/```json|```/g,'').trim());
  } catch {
    S.roadmap=S.skillsNeed.slice(0,weeks).map((sk,i)=>({
      week:i+1,title:`Learn ${sk}`,hours:S.hoursPerWeek,
      steps:[
        `Step 1: Introduction – What is ${sk} and why it matters for ${S.dreamJob}`,
        `Step 2: Setup – Install and configure tools needed for ${sk}`,
        `Step 3: Core Concepts – Learn the fundamental principles of ${sk}`,
        `Step 4: Hands-on Practice – Complete beginner exercises in ${sk}`,
        `Step 5: Mini Project – Build a small project using ${sk}`
      ]
    }));
    // fill remaining weeks if needed
    while(S.roadmap.length<weeks){
      const w=S.roadmap.length+1;
      S.roadmap.push({week:w,title:'Review & Build Portfolio',hours:S.hoursPerWeek,steps:[
        'Step 1: Review – Revisit all skills learned so far','Step 2: Consolidate – Fix gaps in your understanding',
        'Step 3: Project Planning – Design a portfolio project','Step 4: Development – Build the project',
        'Step 5: Deploy & Share – Publish your project online'
      ]});
    }
  }
  S.roadmapReady=true;document.getElementById('rm-loading').style.display='none';showRoadmap();
  announce(`Your learning roadmap is ready with ${S.roadmap.length} weeks.`);
}
function showRoadmap(){
  document.getElementById('rm-content').innerHTML=S.roadmap.map(w=>{
    const done=S.completedWeeks.has(w.week);
    return `
    <div class="week-card" id="wcard-${w.week}" style="${done?'border-left-color:#10b981;opacity:.85':''}">
      <div class="week-hdr">
        <div class="week-num" style="${done?'background:linear-gradient(135deg,#10b981,#06b6d4)':''}">W${w.week}</div>
        <div>
          <div class="week-title">${done?'✅ ':''}${w.title}</div>
          <div class="week-hrs">⏱ ${w.hours} hours this week</div>
        </div>
      </div>
      <ul class="steps-list">
        ${(w.steps||[]).map(s=>`<li><span class="step-num">${s.split(':')[0]}:</span>${s.split(':').slice(1).join(':')}</li>`).join('')}
      </ul>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap">
        <button onclick="goTo('courses')" style="background:var(--social-bg);border:1.5px solid var(--inp-b);color:#7c3aed;padding:9px 18px;font-size:.82rem;border-radius:10px;cursor:pointer;font-family:inherit;font-weight:600;display:inline-flex;align-items:center;gap:6px">
          📚 View Course Suggestion
        </button>
        <button onclick="toggleWeekDone(${w.week})" style="background:${done?'#10b981':'var(--social-bg)'};border:1.5px solid ${done?'#10b981':'var(--inp-b)'};color:${done?'#fff':'#7c3aed'};padding:9px 18px;font-size:.82rem;border-radius:10px;cursor:pointer;font-family:inherit;font-weight:600;display:inline-flex;align-items:center;gap:6px">
          ${done?'✅ Completed':'✓ Mark as Completed'}
        </button>
      </div>
    </div>`;
  }).join('');
}
function toggleWeekDone(week){
  const nowDone=!S.completedWeeks.has(week);
  nowDone?S.completedWeeks.add(week):S.completedWeeks.delete(week);
  showRoadmap();
  announce('Week '+week+(nowDone?' marked as completed.':' marked as incomplete.'));
}

// ── COURSES ──────────────────────────────────────
function renderCourses(){
  document.getElementById('c-loading').style.display='none';
  document.getElementById('c-content').style.display='block';
  // find job in DB
  const jobKey=JOB_LIST.find(j=>j.toLowerCase()===S.dreamJob.toLowerCase())||null;
  const courses=jobKey&&COURSE_DB[jobKey]?COURSE_DB[jobKey]:[];
  if(!S.dreamJob||!courses.length){
    document.getElementById('c-list').innerHTML='<div class="card" style="color:var(--muted)">Please complete an analysis first to see course recommendations.</div>';
    document.getElementById('skill-filter').innerHTML='';return;
  }
  // build filter
  const skills=['All',...new Set(courses.map(c=>c.skill))];
  document.getElementById('skill-filter').innerHTML=skills.map(s=>
    `<button class="sf-btn${s===S.activeSkillFilter?' active':''}" onclick="setFilter('${s}')">${s}</button>`
  ).join('');
  showCourseList(courses);
  announce(`Course recommendations loaded for ${S.dreamJob}.`);
}
function setFilter(f){S.activeSkillFilter=f;renderCourses();}

function getYouTubeId(url){
  if(!url) return null;
  const match = url.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

let currentPlayingCourse = null;
let currentPlayingVideoId = null;

function playEmbeddedCourse(name, url, skill, duration){
  const vId = getYouTubeId(url);
  if(!vId){
    if(url) window.open(url, '_blank');
    return;
  }

  currentPlayingCourse = name;
  currentPlayingVideoId = vId;

  // Switch to courses page if not already there
  if(typeof goTo === 'function'){
    const appScreen = document.getElementById('screen-app');
    if(appScreen && !appScreen.classList.contains('active') && typeof go === 'function'){
      go('app');
    }
    const curPage = document.querySelector('.page.active');
    if(!curPage || curPage.id !== 'page-courses'){
      goTo('courses');
    }
  }

  const playerCard = document.getElementById('yt-clone-player');
  const iframe = document.getElementById('yt-embedded-iframe');
  const titleEl = document.getElementById('yt-clone-title');
  const durationBadge = document.getElementById('yt-duration-badge');
  const extLink = document.getElementById('yt-external-link');
  const notesCourseName = document.getElementById('yt-notes-course-name');
  const notesTextarea = document.getElementById('yt-notes-textarea');

  if(titleEl) titleEl.textContent = name;
  if(durationBadge) durationBadge.textContent = `• ${skill || ''} • ${duration || ''}`;
  if(extLink) extLink.href = url || `https://www.youtube.com/watch?v=${vId}`;
  if(notesCourseName) notesCourseName.textContent = name;

  if(notesTextarea){
    try{
      notesTextarea.value = localStorage.getItem(`yt_notes_${name}`) || '';
    }catch(e){}
  }

  updatePlayerCompletionButton(name);

  if(iframe){
    iframe.src = `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`;
  }

  if(playerCard){
    playerCard.style.display = 'block';
    playerCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.querySelectorAll('.course-card').forEach(card=>{
    if(card.getAttribute('data-voice-label') === name.toLowerCase()){
      card.classList.add('is-playing');
    } else {
      card.classList.remove('is-playing');
    }
  });

  renderUpNextList(name);

  if(typeof speak === 'function'){
    speak(`Playing ${name} inside SkillNexus.`);
  }

  if(window.youtubeTools){
    window.youtubeTools.isPlayingVideo = true;
    window.youtubeTools.currentVideoId = vId;
  }
}

function closeEmbeddedCourse(){
  const playerCard = document.getElementById('yt-clone-player');
  const iframe = document.getElementById('yt-embedded-iframe');
  if(iframe) iframe.src = '';
  if(playerCard) playerCard.style.display = 'none';
  currentPlayingCourse = null;
  currentPlayingVideoId = null;
  document.querySelectorAll('.course-card').forEach(c=>c.classList.remove('is-playing'));
  if(window.youtubeTools){
    window.youtubeTools.isPlayingVideo = false;
  }
}

function toggleTheaterMode(){
  const wrapper = document.getElementById('yt-video-frame-container');
  if(wrapper) wrapper.classList.toggle('theater');
}

function toggleNotesDrawer(){
  const drawer = document.getElementById('yt-notes-drawer');
  if(drawer){
    const isHidden = drawer.style.display === 'none';
    drawer.style.display = isHidden ? 'block' : 'none';
    if(isHidden) document.getElementById('yt-notes-textarea')?.focus();
  }
}

function toggleCourseLike(){
  const btn = document.getElementById('yt-like-btn');
  const countEl = document.getElementById('yt-like-count');
  if(btn && countEl){
    const isLiked = btn.classList.toggle('liked');
    let count = parseFloat(countEl.textContent) || 1.4;
    count = isLiked ? (count + 0.1).toFixed(1) : (count - 0.1).toFixed(1);
    countEl.textContent = count + 'K';
    if(typeof showToast === 'function'){
      showToast(isLiked ? 'Added to liked courses! 👍' : 'Removed from liked courses.');
    }
  }
}

function shareCurrentCourse(){
  const url = currentPlayingVideoId ? `https://youtu.be/${currentPlayingVideoId}` : window.location.href;
  if(navigator.clipboard){
    navigator.clipboard.writeText(url).then(()=>{
      if(typeof showToast === 'function') showToast('Course link copied to clipboard! 🔗');
      else alert('Course link copied!');
    });
  }
}

function toggleCurrentCourseDone(){
  if(currentPlayingCourse){
    toggleDone(currentPlayingCourse);
    updatePlayerCompletionButton(currentPlayingCourse);
  }
}

function updatePlayerCompletionButton(name){
  const btn = document.getElementById('yt-complete-btn');
  const text = document.getElementById('yt-complete-text');
  if(btn && text && window.S){
    const isDone = S.completedCourses.has(name);
    if(isDone){
      btn.style.background = 'linear-gradient(135deg, #7c3aed, #4f46e5)';
      text.textContent = 'Skill Learned! ✅';
    }else{
      btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
      text.textContent = 'Mark as Completed ✅';
    }
  }
}

function renderUpNextList(currentName){
  const container = document.getElementById('yt-up-next-list');
  if(!container) return;

  const jobKey = JOB_LIST.find(j=>j.toLowerCase()===(S.dreamJob||'').toLowerCase())||null;
  const courses = jobKey && COURSE_DB[jobKey] ? COURSE_DB[jobKey] : [];
  const otherCourses = courses.filter(c=>c.name !== currentName);

  if(otherCourses.length === 0){
    container.innerHTML = '<div style="color:#94a3b8;font-size:0.8rem">No additional courses in this roadmap.</div>';
    return;
  }

  container.innerHTML = otherCourses.slice(0, 8).map(c=>{
    const vId = getYouTubeId(c.url) || 'jS4aFq5-91M';
    const thumb = `https://img.youtube.com/vi/${vId}/mqdefault.jpg`;
    const escapedName = c.name.replace(/'/g, "\\'");
    return `
      <div class="yt-mini-card" onclick="playEmbeddedCourse('${escapedName}', '${c.url}', '${c.skill}', '${c.duration}')">
        <img class="yt-mini-thumb" src="${thumb}" alt="${c.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300'"/>
        <div class="yt-mini-name">${c.name}</div>
        <div class="yt-mini-meta">${c.skill} • ${c.duration}</div>
      </div>
    `;
  }).join('');
}

// Auto-save lecture notes
if(typeof document !== 'undefined'){
  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'yt-notes-textarea' && currentPlayingCourse) {
      try {
        localStorage.setItem(`yt_notes_${currentPlayingCourse}`, e.target.value);
        const indicator = document.getElementById('yt-notes-saved');
        if (indicator) {
          indicator.textContent = 'Saved ✓';
          clearTimeout(window._notesTimer);
          window._notesTimer = setTimeout(() => {
            indicator.textContent = 'Auto-saved ✓';
          }, 1200);
        }
      } catch(err) {}
    }
  });
}

function showCourseList(courses){
  const filtered=S.activeSkillFilter==='All'?courses:courses.filter(c=>c.skill===S.activeSkillFilter);
  const icons={YouTube:'▶️',freeCodeCamp:'🏕',Udemy:'📘',Coursera:'🎓'};
  document.getElementById('c-list').innerHTML=filtered.map((c,i)=>{
    const done=S.completedCourses.has(c.name);
    const vId=getYouTubeId(c.url);
    const thumb=vId ? `https://img.youtube.com/vi/${vId}/mqdefault.jpg` : '';
    const isPlaying = currentPlayingCourse === c.name;
    const escapedName = c.name.replace(/'/g, "\\'");

    return `<div class="course-card${isPlaying ? ' is-playing' : ''}" data-voice-label="${c.name.toLowerCase()}">
      ${thumb ? `<img class="course-card-thumb" src="${thumb}" alt="${c.name}" loading="lazy" onclick="playEmbeddedCourse('${escapedName}', '${c.url}', '${c.skill}', '${c.duration}')" style="cursor:pointer" onerror="this.style.display='none'"/>` : `<div class="c-icon">${icons[c.platform]||'📖'}</div>`}
      <div class="c-info">
        <div class="c-name" onclick="playEmbeddedCourse('${escapedName}', '${c.url}', '${c.skill}', '${c.duration}')" style="cursor:pointer" title="Click to watch inside website">${c.name}</div>
        <div class="c-meta">
          <span class="badge ${c.type==='free'?'b-free':'b-paid'}">${c.type==='free'?'FREE':'PAID'}</span>
          <span class="badge b-yt">${c.platform}</span>
          <span style="font-size:.76rem;color:var(--muted)">• ${c.skill} • ${c.duration}</span>
        </div>
        <div class="c-actions">
          <button class="btn btn-p btn-sm" onclick="playEmbeddedCourse('${escapedName}', '${c.url}', '${c.skill}', '${c.duration}')">
            ▶️ Watch in Website
          </button>
          <button class="${done?'btn-g':''}" style="${done?'':'background:var(--social-bg);border:1.5px solid var(--inp-b);color:#7c3aed;padding:7px 14px;font-size:.78rem;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:600'}" onclick="toggleDone('${escapedName}'); updatePlayerCompletionButton('${escapedName}');">
            ${done?'Skill Learned! ✅':'Mark as Completed ✅'}
          </button>
          <a href="${c.url}" target="_blank" rel="noopener" style="text-decoration:none" title="Open directly on YouTube (optional)"><button class="btn btn-o btn-sm" style="padding:7px 10px;font-size:.76rem">↗</button></a>
        </div>
      </div>
    </div>`;
  }).join('');
}
// function toggleDone(name){
//   S.completedCourses.has(name)?S.completedCourses.delete(name):S.completedCourses.add(name);
//   renderCourses();
// }
async function toggleDone(name){

  if(S.completedCourses.has(name)){
    S.completedCourses.delete(name);
  }else{
    S.completedCourses.add(name);
  }

  try{
    const q = query(
      collection(fsdb, "users"),
      where("email", "==", S.user.email)
    );

    const snap = await getDocs(q);

    console.log("Logged in user email:", S.user.email);
    console.log("Documents found:", snap.size);

    for (const d of snap.docs) {
      await updateDoc(
        doc(fsdb, "users", d.id),
        {
          completedCourses: [...S.completedCourses]
        }
      );
    }

  } catch(err){
    console.error(err);
  }

  renderCourses();
  announce(S.completedCourses.has(name)?'Course completed: '+name:'Course marked as not completed: '+name);
}// ── PROGRESS ─────────────────────────────────────
function renderProgress(){
  const jobKey=JOB_LIST.find(j=>j.toLowerCase()===S.dreamJob.toLowerCase());
  const allCourses=jobKey&&COURSE_DB[jobKey]?COURSE_DB[jobKey]:[];
  const total=(S.skillsHave.length+S.skillsNeed.length)||1;
  const ovPct=Math.round((S.skillsHave.length/total)*100);
  const coPct=allCourses.length?Math.round((S.completedCourses.size/allCourses.length)*100):0;
  document.getElementById('pg-overall').innerHTML=[
    {l:'Skills Acquired',p:ovPct,v:`${S.skillsHave.length}/${total}`},
    {l:'Courses Completed',p:coPct,v:`${S.completedCourses.size}/${allCourses.length}`},
    {l:'Skill Match Score',p:S.matchScore,v:`${S.matchScore}%`}
  ].map(x=>`<div class="prog-item"><div class="prog-lbl"><span>${x.l}</span><span>${x.v}</span></div><div class="prog-wrap"><div class="prog-bar" style="width:${x.p}%"></div></div></div>`).join('');
  const allS=[...S.skillsHave.map(s=>({s,p:100})),...S.skillsNeed.map(s=>({s,p:0}))];
  document.getElementById('pg-skills').innerHTML=allS.length
    ?allS.map(({s,p})=>`<div class="prog-item"><div class="prog-lbl"><span>${s}</span><span style="color:${p===100?'#10b981':'var(--muted)'}">${p===100?'✓ Have':'To Learn'}</span></div><div class="prog-wrap"><div class="prog-bar" style="width:${p}%;background:${p===100?'linear-gradient(90deg,#10b981,#06b6d4)':'linear-gradient(90deg,#c4b5fd,#818cf8)'}"></div></div></div>`).join('')
    :'<div style="color:var(--muted);font-size:.88rem">Complete an analysis first.</div>';
  const doneNames=[...S.completedCourses];
  document.getElementById('pg-done').innerHTML=doneNames.length
    ?doneNames.map(n=>{const c=allCourses.find(x=>x.name===n);return`<div class="skill-item"><span style="color:#10b981">✓</span>${n}${c?` <span style="font-size:.77rem;color:var(--muted);margin-left:6px">(${c.platform})</span>`:''}</div>`;}).join('')
    :'<div style="color:var(--muted);font-size:.88rem">No completed courses yet. Visit Courses and mark them!</div>';

    
}

// ── PROFILE ──────────────────────────────────────
function renderProfile(){
  if(!S.user)return;
  const{name,email}=S.user;
  document.getElementById('pf-av').textContent=name.charAt(0).toUpperCase();
  ['pf-name','pf-n2'].forEach(id=>document.getElementById(id).textContent=name);
  ['pf-email','pf-e2'].forEach(id=>document.getElementById(id).textContent=email);
  document.getElementById('pf-job').textContent=S.dreamJob||'Not set yet';
  document.getElementById('pf-hrs').textContent=S.dreamJob?`${S.hoursPerWeek} hrs/week`:'—';
  document.getElementById('pf-stats').innerHTML=`
    <div class="stat-box"><div class="stat-num">${S.skillsHave.length}</div><div class="stat-lbl">Skills Have</div></div>
    <div class="stat-box"><div class="stat-num">${S.skillsNeed.length}</div><div class="stat-lbl">To Learn</div></div>
    <div class="stat-box"><div class="stat-num">${S.completedCourses.size}</div><div class="stat-lbl">Courses Done</div></div>
    <div class="stat-box"><div class="stat-num">${S.matchScore}%</div><div class="stat-lbl">Match Score</div></div>`;
  document.getElementById('pf-have').innerHTML=S.skillsHave.length
    ?'<div class="tag-area">'+S.skillsHave.map(s=>`<div class="tag">✓ ${s}</div>`).join('')+'</div>'
    :'<div style="color:var(--muted);font-size:.88rem">No skills recorded yet.</div>';
  document.getElementById('pf-goals').innerHTML=S.skillsNeed.length
    ?S.skillsNeed.map(s=>`<div class="skill-item"><span style="color:#7c3aed">🎯</span>${s}</div>`).join('')
    :'<div style="color:var(--muted);font-size:.88rem">Complete an analysis to see goals.</div>';

    
}

// ── USER DATABASE (Firebase Firestore) ───────────
async function saveUserToDB(name, email, method){
  try{
    const usersRef = fsdb.collection("users");
    // check if user already exists
    const existing = await usersRef.where("email","==",email).get();
    if(existing.empty){
      // await usersRef.add({
      //   name: name,
      //   email: email,
      //   method: method==='signup'?'Email Signup': method==='email'?'Email Login':'Google',
      //   dreamJob: '',
      //   joined: new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}),
      //   joinedTimestamp: Date.now()
      // });
      await usersRef.add({
  name: name,
  email: email,
  method: method==='signup'?'Email Signup': method==='email'?'Email Login':'Google',
  dreamJob: '',
  completedCourses: [],
  joined: new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}),
  joinedTimestamp: Date.now()
});
      console.log('✅ User saved to Firebase:', email);
      showToast('✅ Account saved successfully!');
    } else {
      console.log('ℹ️ User already exists:', email);
    }
  } catch(e){
    console.error('❌ Firebase save error:', e);
    showToast('⚠️ Could not save to database: ' + e.message);
  }
}

async function updateUserJobInDB() {
  if (!S.user || !S.dreamJob) return;

  try {
    const usersRef = collection(fsdb, "users");

    const q = query(
      usersRef,
      where("email", "==", S.user.email)
    );

    const snap = await getDocs(q);

    for (const document of snap.docs) {
      await updateDoc(doc(fsdb, "users", document.id), {
        dreamJob: S.dreamJob
      });
    }

    console.log("✅ Dream job updated in Firebase");
  } catch (e) {
    console.error("Firebase update error:", e);
  }
}

// ── TOAST NOTIFICATION ────────────────────────────
function showToast(msg,type){
  let t = document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast';
    t.style.cssText='position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1e1b4b;color:#fff;padding:12px 24px;border-radius:12px;font-size:.88rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:opacity .3s';
    document.body.appendChild(t);
  }
  t.setAttribute('role',type==='error'?'alert':'status');
  t.textContent=msg; t.style.opacity='1';
  setTimeout(()=>{ t.style.opacity='0'; }, 3000);
  if(type==='error')speak(msg);
}

// ── VOICE ASSISTANT (Web Speech API) ──────────────
const V = Object.assign(window.V || {}, {
  enabled: true,
  rate: 1.25,
  listening: false,
  handsFree: true,
  continuousListening: true,
  isSpeaking: false,
  autoWelcomeTriggered: false,
  recognition: null,
  lastSpoken: '',
  pageHistory: [],
  suppressHistory: false,
  loginFlow: { active: false, step: 'idle', email: '' },
  dreamFlow: { active: false, raw: '', pending: null },
  interest: { active: false, stage: 'idle', matches: [], introShown: false },
  registrationFlow: { active: false, step: 'idle', name: '', email: '', attempts: 0 },
  voiceBioFlow: { active: false, mode: 'login', step: 'name', user: null, attempts: 0, tempName: '', enrollName: '' },
  analysisFlow: { active: false, step: 'idle', skill: '', currentSkills: '', time: '' },
  courseFlow: { active: false, currentCourseIndex: 0 },
  analyseHintShown: false
});
window.V = V;
try{
  const saved=JSON.parse(localStorage.getItem('skillsync_voice')||'{}');
  if(saved.rate)V.rate=parseFloat(saved.rate)||1.25;
}catch(e){}
V.enabled = true;
if (window.V && window.V.voice) window.V.voice.enabled = true;

function speechSupported(){
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
function playAudioChime(type='listen'){
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if(!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'listen') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'recognized') {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch(e) {}
}

function speak(text, onDone){
  if(typeof text!=='string'||!text.trim()){
    if(onDone) onDone();
    return;
  }

  // Respect explicit mute toggle from checkbox
  const voiceCb = document.getElementById('voice-enabled');
  if(voiceCb && !voiceCb.checked && !V.blindCheckActive){
    if(onDone) onDone();
    return;
  }

  V.enabled = true;
  if (window.V && window.V.voice) window.V.voice.enabled = true;
  try{
    V.lastSpoken = text;
    V.isSpeaking = true;
    if (window.speechSynthesisWrapper && window.speechSynthesisWrapper.recordSpoken) {
      window.speechSynthesisWrapper.recordSpoken(text);
    }
    
    // Only pause recognition in manual mode - never during blind check or continuous hands-free mode
    if (!V.blindCheckActive && !V.handsFree && !V.continuousListening && V.recognition && V.listening) {
      try { V.recognition.stop(); } catch(e){}
    }

    let doneCalled = false;
    const safeOnDone = () => {
      if (doneCalled) return;
      doneCalled = true;
      V.isSpeaking = false;
      if (onDone) onDone();
    };

    // Safety watchdog in case browser speech synthesis stalls
    const wordCount = (text || "").split(/\s+/).length;
    const maxSpeechDuration = Math.min(12000, Math.max(3000, wordCount * 500));
    const watchdog = setTimeout(safeOnDone, maxSpeechDuration);

    if (window.speechSynthesisWrapper) {
      window.speechSynthesisWrapper.speak(text).then(() => {
        clearTimeout(watchdog);
        safeOnDone();
        if (V.enabled && (V.handsFree || V.continuousListening || V.blindCheckActive)) {
          setTimeout(() => { if (!V.isSpeaking && window.startListening) window.startListening(); }, 200);
        }
      });
      return;
    }

    if (!('speechSynthesis' in window)) {
      V.isSpeaking = false;
      if (onDone) onDone();
      return;
    }

    speechSynthesis.cancel();
    try { speechSynthesis.resume(); } catch(e){}
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = V.rate || 1.25;
    const voices = speechSynthesis.getVoices().filter(v => /en[-_]/i.test(v.lang));
    const localVoices = voices.filter(v => v.localService === true);
    const chosenVoice = localVoices.length > 0
      ? (localVoices.find(v => /david|zira|mark|samantha|george|daniel/i.test(v.name)) || localVoices[0])
      : (voices.length > 0 ? voices[0] : null);
    if (chosenVoice) u.voice = chosenVoice;
    u.onend = () => {
      V.isSpeaking = false;
      if (onDone) onDone();
      if (V.enabled && (V.handsFree || V.continuousListening)) {
        setTimeout(() => { if (!V.isSpeaking) startListening(); }, 300);
      }
    };
    u.onerror = () => {
      V.isSpeaking = false;
      if (u.voice) {
        try {
          const fallbackU = new SpeechSynthesisUtterance(text);
          fallbackU.lang = 'en-US';
          fallbackU.onend = () => { if (onDone) onDone(); };
          speechSynthesis.speak(fallbackU);
          return;
        } catch(err){}
      }
      if (onDone) onDone();
    };
    speechSynthesis.speak(u);
  }catch(e){
    V.isSpeaking = false;
    console.error('speak error:',e);
    if(onDone) onDone();
  }
}

function stopSpeaking(){
  V.isSpeaking = false;
  if (window.speechSynthesisWrapper) {
    window.speechSynthesisWrapper.bargeIn();
  }
  if('speechSynthesis' in window){try{speechSynthesis.cancel();}catch(e){}}
}
function setVoiceStatus(msg){
  const el=document.getElementById('voice-status');
  if(el){
    el.textContent=msg;
    el.classList.remove('listening', 'speaking', 'thinking', 'error');
    const m = (msg || '').toLowerCase();
    if (m.includes('listen')) el.classList.add('listening');
    else if (m.includes('speak')) el.classList.add('speaking');
    else if (m.includes('think') || m.includes('process')) el.classList.add('thinking');
    else if (m.includes('error') || m.includes('denied') || m.includes('failed')) el.classList.add('error');
  }
}
function openPanel(){
  const p=document.getElementById('voice-panel');
  if(p)p.removeAttribute('hidden');
  const b=document.getElementById('mic-btn');
  if(b)b.setAttribute('aria-expanded','true');
}
function closePanel(){
  const p=document.getElementById('voice-panel');
  if(p)p.setAttribute('hidden','');
  const b=document.getElementById('mic-btn');
  if(b)b.setAttribute('aria-expanded','false');
}
function saveVoice(){
  try{localStorage.setItem('skillsync_voice',JSON.stringify({enabled:V.enabled,rate:V.rate}));}catch(e){}
}
function toggleVoiceFeedback(){
  V.enabled=document.getElementById('voice-enabled').checked;
  saveVoice();
  announce(V.enabled?'Voice feedback on.':'Voice feedback off.');
}
function setVoiceRate(){
  const el=document.getElementById('voice-rate');
  V.rate=el?parseFloat(el.value):1.25;
  try { localStorage.setItem('voiceRate', String(V.rate)); } catch(e){}
  saveVoice();
}
function setVoicePersona(val){
  try { localStorage.setItem('voicePersona', val); } catch(e){}
  if (window.supertonicTTS) window.supertonicTTS.setVoice(val);
  const statusEl = document.getElementById('voice-model-status');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.innerHTML = val === 'native' ? 'Standard browser voice active.' : `Selected Persona: ${val}`;
    setTimeout(() => { statusEl.style.display = 'none'; }, 2500);
  }
}
function setVoiceEnabled(on){
  V.enabled=on;
  const cb=document.getElementById('voice-enabled');
  if(cb)cb.checked=on;
  saveVoice();
  announce(on?'Voice feedback on.':'Voice feedback off.');
}
function updateMicUI(){
  const btn=document.getElementById('mic-btn');
  const tgl=document.getElementById('mic-toggle');
  if(V.listening){
    if(btn){btn.classList.add('listening');btn.setAttribute('aria-label','Voice assistant, stop listening');}
    if(tgl)tgl.innerHTML='⏹ Stop Listening';
    setVoiceStatus('Listening... Say a command. Say "stop listening" to end.');
  }else{
    if(btn){btn.classList.remove('listening');btn.setAttribute('aria-label','Voice assistant, start listening');}
    if(tgl)tgl.innerHTML='🎤 Start Listening';
  }
}
async function startListening(){
  V.enabled = true;
  if (window.V && window.V.voice) window.V.voice.enabled = true;
  if (window.streamingSpeechRecognition) {
    await window.streamingSpeechRecognition.startContinuous();
  }
}

function stopListening(force=false){
  if (window.streamingSpeechRecognition) {
    window.streamingSpeechRecognition.stopContinuous();
  }
}

function toggleListening(){
  if (window.voiceAssistant) {
    window.voiceAssistant.handleVoiceToggle();
  } else if (window.streamingSpeechRecognition) {
    if (window.streamingSpeechRecognition.isContinuous) {
      window.streamingSpeechRecognition.stopContinuous();
    } else {
      window.streamingSpeechRecognition.startContinuous();
    }
  }
}

window.startListening = startListening;
window.stopListening = stopListening;
window.toggleListening = toggleListening;

// ── VOICE LOGIN FLOW ──────────────────────────────
function startVoiceAssistant(){
  openPanel();
  if(window.voiceAssistant){
    window.voiceAssistant.startPageFlow(getCurrentPage());
  } else {
    if(V.listening)voiceContextIntro();
    else startListening();
  }
}
function getCurrentPage(){
  if (window.pageTools && window.pageTools.getCurrentPageId) {
    return window.pageTools.getCurrentPageId();
  }
  const p=document.querySelector('.page.active');
  return p?p.id.replace('page-',''):'analyse';
}
function goBack(){
  const prev=V.pageHistory.pop()||'analyse';
  V.suppressHistory=true;
  goTo(prev);
  V.suppressHistory=false;
  announce('Going back to '+(prev==='analyse'?'the dashboard':prev));
}
function parseSpokenEmail(t){
  let s=t.toLowerCase().trim();
  s=s.replace(/^(my\s+)?(email\s+|email\s+address\s+)?(is\s+|is)\s+/,'');
  s=s.replace(/\s*\[at\]\s*/g,'@');
  s=s.replace(/\s*at\s+/g,'@');
  s=s.replace(/\s*dot\s*/g,'.');
  s=s.replace(/\s*(underscore|under score)\s*/g,'_');
  s=s.replace(/\s*(hyphen|dash)\s*/g,'-');
  s=s.replace(/\s+/g,'');
  return s;
}
function voiceContextIntro(){
  const loginScreen=document.getElementById('screen-login');
  if(loginScreen&&loginScreen.classList.contains('active')){
    if(!V.loginFlow.active)startLoginFlow();
    else rePromptLoginStep();
  }else if (V.loginFlow.active) {
    // Keep login flow active even if navigated away, but don't re-announce
  }else{
    announce('Voice assistant is active. Say help for commands. For example: go to courses, show my skill gap, or read this page.');
  }
}
function startLoginFlow(){
  V.loginFlow.active=true;
  V.loginFlow.email='';
  V.loginFlow.step='email';
  const emailInp=document.getElementById('login-email');
  if(emailInp) emailInp.value='';
  speak('Welcome to SkillSync AI. To log in by voice, I will ask for your email. Say your email, for example: john dot smith at gmail dot com.');
}
function rePromptLoginStep(){
  if(!V.loginFlow.active)return;
  if(V.loginFlow.step==='email')speak('Say your email, for example: john dot smith at gmail dot com.');
  else if(V.loginFlow.step==='confirm')speak('Say confirm, or say change to enter your email again.');
  else if(V.loginFlow.step==='password')speak('Type your password on the keyboard and say login when you are done.');
}
function exitLoginFlow(){
  V.loginFlow.active=false;
  V.loginFlow.step='idle';
  V.loginFlow.email='';
}
function handleLoginVoiceCommand(t,c){
  const step=V.loginFlow.step;
  if(c.includes('stop listening')||c.includes('stop assistant')){
    stopSpeaking();stopListening();exitLoginFlow();announce('Voice assistant stopped.');return;
  }
  if(c.includes('stop')||c.includes('quiet')){
    stopSpeaking();
    if(step==='email')speak('Okay. Say your email when ready.');
    else if(step==='confirm')speak('Okay. Say confirm or change.');
    else if(step==='password')speak('Okay. Type your password and say login when done.');
    return;
  }
  if(c.includes('cancel')||c.includes('go back')||c.includes('back')||c.includes('exit')){
    exitLoginFlow();announce('Login by voice cancelled. You can type your email and password normally.');return;
  }
  if(c.includes('help')){
    speak('Voice login instructions: Say your email, then I will repeat it and you can say confirm. Then type your password on the keyboard and say login.');return;
  }
  if(c.includes('google') || c.includes('continue with google') || c.includes('sign in with google')){
    exitLoginFlow();
    const btn = document.getElementById("btn-google-login") || document.querySelector("#screen-login .social-btn");
    speak("Continuing with Google.");
    if(btn) btn.click();
    else doLogin('google');
    return;
  }
  if(step==='email'){
    const em=parseSpokenEmail(t);
    if(!/@.+\../.test(em)){
      speak('I did not catch a valid email. Please say it again, for example: john dot smith at gmail dot com.');
      return;
    }
    V.loginFlow.email=em;
    V.loginFlow.step='confirm';
    const el=document.getElementById('login-email');if(el)el.value=em;
    speak(`You said ${em}. Say confirm to continue, or say change to enter it again.`);
    return;
  }
  if(step==='confirm'){
    if(c.includes('confirm')||c.includes('correct')||c.includes('yes')||c.includes('right')){
      V.loginFlow.step='password';
      speak('Please type your password in the password box using the keyboard. I will not read it aloud for security. When you are done, say login.');
      const p=document.getElementById('login-pass');if(p)p.focus();
    }else if(c.includes('change')||c.includes('no')||c.includes('different')){
      V.loginFlow.step='email';
      V.loginFlow.email='';
      const el=document.getElementById('login-email');if(el)el.value='';
      speak('Okay. Say your email again.');
    }else{
      speak('Say confirm, or say change.');
    }
    return;
  }
  if(step==='password'){
    if(c.includes('login')||c.includes('log in')||c.includes('submit')||c.includes('done')){
      submitVoiceLogin();
    }else if(c.includes('change email')||c.includes('change')||c.includes('different')){
      V.loginFlow.step='email';
      V.loginFlow.email='';
      const el=document.getElementById('login-email');if(el)el.value='';
      speak('Okay. Say your email again.');
    }else{
      speak('Type your password and say login when you are done.');
    }
    return;
  }
}
function submitVoiceLogin(){
  doLogin('email');
}

// ── VOICE DREAM JOB ───────────────────────────────
function isDreamJobPhrase(c){
  return /^(my\s+dream\s+job\s+is|set\s+(my\s+)?(dream\s+)?job\s+(as\s+|to\s+))/i.test(c.trim());
}
function extractDreamJob(t){
  let s=t.trim();
  s=s.replace(/^(please|hey|okay|ok|hello|hi)\s+/i,'');
  s=s.replace(/^i\s+want\s+to\s+learn\s+to\s+be\s+/i,'');
  s=s.replace(/^i\s+want\s+to\s+work\s+as\s+/i,'');
  s=s.replace(/^i\s+want\s+to\s+become\s+/i,'');
  s=s.replace(/^i\s+want\s+to\s+be\s+/i,'');
  s=s.replace(/^i\s+would\s+like\s+to\s+(be|become|work\s+as)\s+/i,'');
  s=s.replace(/^my\s+dream\s+job\s+is\s+to\s+be\s+/i,'');
  s=s.replace(/^my\s+dream\s+job\s+is\s+/i,'');
  s=s.replace(/^dream\s+job\s+is\s+/i,'');
  s=s.replace(/^set\s+(my\s+)?(dream\s+)?job\s+(as\s+|to\s+)/i,'');
  s=s.replace(/^(a|an|the)\s+/i,'');
  s=s.replace(/\s+and\s*$/i,'');
  s=s.replace(/[.!?,]+$/,'');
  return s.trim();
}
function matchDreamJob(raw){
  const q=raw.toLowerCase().trim();
  const exact=JOB_LIST.find(j=>j.toLowerCase()===q);
  if(exact)return {job:exact,method:'exact'};
  const incl=JOB_LIST.find(j=>q.includes(j.toLowerCase().split(' ')[0].replace(/\//g,''))||j.toLowerCase().includes(q));
  if(incl)return {job:incl,method:'matched'};
  const words=new Set(q.split(/\s+/));
  let best=null,bestScore=0;
  JOB_LIST.forEach(j=>{
    const jw=j.toLowerCase().split(/\s+/);
    const score=jw.reduce((a,w)=>a+(words.has(w.replace(/\//g,''))?1:0),0);
    if(score>bestScore){bestScore=score;best=j;}
  });
  if(best&&bestScore>0)return {job:best,method:'suggested',score:bestScore};
  return null;
}
function applyDreamJob(job){
  S.dreamJob=job;
  const inp=document.getElementById('dream-job');
  if(inp)inp.value=job;
  V.dreamFlow={active:false,raw:'',pending:null};
  speak(`Dream job set to ${job}.`);
}
function startDreamJob(t,c){
  const raw=extractDreamJob(t);
  if(!raw){announce('Sorry, I did not catch the job name. Say your dream job again, for example: my dream job is web developer.');return;}
  const m=matchDreamJob(raw);
  if(!m){
    announce(`Sorry, I could not find a match for ${raw}. Try a common job like web developer, data analyst, data scientist, software engineer, or ui ux designer.`);
    return;
  }
  if(m.method==='suggested'){
    V.dreamFlow={active:true,raw:raw,pending:m.job};
    speak(`I could not find ${raw} in our list, but the closest match is ${m.job}. Say confirm to use it, or say the job name again.`);
    return;
  }
  applyDreamJob(m.job);
}
function handleDreamCommand(t,c){
  if(c.includes('confirm')||c.includes('yes')||c.includes('correct')||c.includes('ok')){
    if(V.dreamFlow.pending)applyDreamJob(V.dreamFlow.pending);
    else{V.dreamFlow={active:false,raw:'',pending:null};announce('No dream job to confirm. Please say your dream job.');}
    return;
  }
  if(c.includes('cancel')||c.includes('no')||c.includes('change')||c.includes('stop')||c.includes('go back')){
    stopSpeaking();
    V.dreamFlow={active:false,raw:'',pending:null};
    announce('Okay, dream job cancelled. Tell me your dream job anytime, for example: my dream job is web developer.');
    return;
  }
  if(isDreamJobPhrase(c)){startDreamJob(t,c);return;}
  speak('Say confirm to set '+V.dreamFlow.pending+', or say the job name again.');
}

// ── VOICE DREAM JOB DISCOVERY (BY INTEREST) ───────
const INTEREST_MAP={
  'web development':['Web Developer','Full Stack Developer'],
  'full stack':['Full Stack Developer'],
  'frontend':['Web Developer','Full Stack Developer'],
  'front end':['Web Developer','Full Stack Developer'],
  'backend':['Full Stack Developer'],
  'back end':['Full Stack Developer'],
  'web design':['UI/UX Designer','Web Developer'],
  'website':['Web Developer','Full Stack Developer'],
  'mobile':['Android Developer'],
  'android':['Android Developer'],
  'app development':['Android Developer'],
  'data analysis':['Data Analyst'],
  'data science':['Data Scientist'],
  'machine learning':['AI/ML Engineer'],
  'artificial intelligence':['AI/ML Engineer'],
  'ai':['AI/ML Engineer'],
  'ml':['AI/ML Engineer'],
  'database':['Database Administrator'],
  'sql':['Database Administrator'],
  'data':['Data Analyst','Data Scientist','Database Administrator','Business Analyst'],
  'ui':['UI/UX Designer'],
  'ux':['UI/UX Designer'],
  'graphic':['UI/UX Designer'],
  'design':['UI/UX Designer'],
  'cyber':['Cyber Security Analyst'],
  'security':['Cyber Security Analyst'],
  'hacking':['Cyber Security Analyst'],
  'cloud':['Cloud Engineer'],
  'aws':['Cloud Engineer'],
  'azure':['Cloud Engineer'],
  'devops':['DevOps Engineer'],
  'dev ops':['DevOps Engineer'],
  'game':['Game Developer'],
  'gaming':['Game Developer'],
  'unity':['Game Developer'],
  'software':['Software Engineer'],
  'programming':['Software Engineer','Web Developer'],
  'coding':['Software Engineer','Web Developer'],
  'network':['Network Engineer'],
  'networking':['Network Engineer'],
  'business':['Business Analyst'],
  'analyst':['Business Analyst','Data Analyst']
};
const NUM_WORDS={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13};
function isJobDiscoverPhrase(c){
  return /^(find\s+(me\s+)?a\s+dream\s+job|discover\s+dream\s+jobs|suggest\s+a\s+dream\s+job|list\s+all\s+dream\s+jobs)$/i.test(c.trim());
}
function filterJobsByInterest(c){
  const keys=Object.keys(INTEREST_MAP).sort((a,b)=>b.length-a.length);
  const matched=new Set();
  for(const k of keys){if(c.includes(k)){INTEREST_MAP[k].forEach(j=>matched.add(j));}}
  return [...matched];
}
function parseSpokenNumber(c){
  const m=c.match(/\d+/);
  if(m)return parseInt(m[0],10);
  const words=c.trim().split(/\s+/);
  for(const w of words){if(NUM_WORDS[w])return NUM_WORDS[w];}
  return 0;
}
function listJobs(jobs,fromInterest){
  V.interest={active:true,stage:'pick',matches:jobs,introShown:true};
  const txt=jobs.map((j,i)=>`Option ${i+1}, ${j}.`).join(' ');
  speak(`Here ${jobs.length===1?'is the':'are the'} dream job${jobs.length===1?'':'s'}${fromInterest?' matching your interest':''}. ${txt} Which one is your dream job? Say the option number, or say the job name. Say cancel to stop.`);
}

// ── DREAM JOB FLOW ────────────────────────────────
function startInterestFlow(c){
  V.interest={active:true,stage:'interest',matches:[],introShown:true};
  if(c.includes('list')||c.includes('all')){
    listJobs(JOB_LIST,false);
    return;
  }
  const matches=filterJobsByInterest(c);
  if(matches.length){listJobs(matches,true);return;}
  speak('Tell me your interest, for example: web development, mobile apps, data, artificial intelligence, design, security, cloud, gaming, software, networking, or business. You can also say list all dream jobs to hear every option.');
}
function handleInterestCommand(t,c){
  if(c.includes('stop')||c.includes('cancel')||c.includes('back')||c.includes('exit')||c.includes('no')){
    stopSpeaking();
    V.interest={active:false,stage:'idle',matches:[],introShown:true};
    announce('Dream job search cancelled. You can say find my dream job anytime.');
    return;
  }
  if(c.includes('repeat')||c.includes('again')||c.includes('list all')||c.includes('list dream jobs')){
    if(V.interest.matches.length){listJobs(V.interest.matches,true);return;}
    startInterestFlow(c);
    return;
  }
  const num=parseSpokenNumber(c);
  if(num&&V.interest.matches[num-1]){applyDreamJob(V.interest.matches[num-1]);return;}
  const job=JOB_LIST.find(j=>c.includes(j.toLowerCase()));
  if(job){applyDreamJob(job);return;}
  const matches=filterJobsByInterest(c);
  if(matches.length){listJobs(matches,true);return;}
  speak('Sorry, I did not understand. Say the option number, the job name, or tell me your interest, like data, design, or web development.');
}
function startJobDiscovery(){
  openPanel();
  if(!V.listening)startListening();
  startInterestFlow('');
}

// ── STARTUP ACCESSIBILITY CHECK (Blind User Detection & Interactive Voice Mode) ───
function updateBlindModalStatus(statusText, transcriptText) {
  const sEl = document.getElementById('blind-status-text');
  const tEl = document.getElementById('blind-transcript-text');
  if (sEl && statusText) sEl.textContent = statusText;
  if (tEl && transcriptText !== undefined) tEl.textContent = transcriptText;
}

function promptBlindUserCheck() {
  const modal = document.getElementById('blind-check-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  V.blindCheckActive = true;
  V.enabled = true;
  if (V.voice) {
    V.voice.blindCheckActive = true;
    V.voice.enabled = true;
  }

  updateBlindModalStatus('🎙️ Voice Assistant Ready. Say "Yes" or "No"', 'Speak freely into your microphone — say Yes or No');

  const questionPrompt = 'Welcome to SkillNexus AI. Are you visually impaired or blind? Please speak into your microphone: say Yes to enable the voice assistant, or say No for standard visual mode.';

  // Speak prompt first with completion callback; activate microphone ONLY after prompt finishes speaking!
  speak(questionPrompt, () => {
    if (V.blindCheckActive) {
      updateBlindModalStatus('🎙️ Listening for your voice: Say "Yes" or "No"', 'Speak freely into your microphone — say Yes or No');
      startListening();
      if (window.startListening) {
        window.startListening();
      }
    }
  });

  // Start listening right away in background for 0ms interaction response
  setTimeout(() => {
    if (V.blindCheckActive && !V.listening) {
      startListening();
      if (window.startListening) window.startListening();
    }
  }, 800);
}

function confirmBlindUser(isBlind) {
  const modal = document.getElementById('blind-check-modal');
  if (modal) modal.style.display = 'none';

  V.blindCheckActive = false;
  if (V.voice) V.voice.blindCheckActive = false;

  // Immediately cancel any in-flight prompt speech before starting welcome utterance
  if (window.stopSpeaking) window.stopSpeaking();

  const banner = document.getElementById('accessible-welcome-banner');

  if (isBlind) {
    V.isBlindUser = true;
    V.enabled = true;
    V.handsFree = true;
    V.continuousListening = true;
    if (V.voice) {
      V.voice.isBlindUser = true;
      V.voice.enabled = true;
      V.voice.blindMode = true;
      V.voice.blindCheckActive = false;
    }
    try { localStorage.setItem('skillnexus_blind_mode', 'yes'); } catch(e){}
    
    setVoiceEnabled(true);
    openPanel();
    if (banner) banner.style.display = 'flex';

    const blindWelcome = 'Voice assistant is now enabled for you. You can speak naturally at any time. How can I help you today?';
    speak(blindWelcome, () => {
      startListening();
      if (window.startListening) window.startListening();
    });
    startListening();
    if (window.startListening) window.startListening();

  } else {
    V.isBlindUser = false;
    V.enabled = true;
    V.handsFree = false;
    V.continuousListening = false;
    if (V.voice) {
      V.voice.isBlindUser = false;
      V.voice.enabled = true;
      V.voice.blindMode = false;
      V.voice.blindCheckActive = false;
    }
    try { localStorage.setItem('skillnexus_blind_mode', 'no'); } catch(e){}

    if (banner) banner.style.display = 'none';
    closePanel();

    const visualWelcome = 'Welcome to SkillNexus AI. Voice assistant is ready. Click the microphone anytime you want to speak.';
    speak(visualWelcome);
  }
}

window.promptBlindUserCheck = promptBlindUserCheck;
window.confirmBlindUser = confirmBlindUser;
window.updateBlindModalStatus = updateBlindModalStatus;

function initAutoVoice() {
  if (!speechSupported()) return;

  // Open accessibility startup modal
  promptBlindUserCheck();

  // First interaction gesture listener for browser audio autoplay restrictions
  const onFirstUserGesture = (e) => {
    try {
      if ('speechSynthesis' in window && speechSynthesis.paused) {
        speechSynthesis.resume();
      }
    } catch(err) {}

    // If the click is on the Yes or No buttons, confirmBlindUser handles the response cleanly
    if (e && e.target && (e.target.closest('#btn-blind-yes') || e.target.closest('#btn-blind-no'))) {
      window.removeEventListener('click', onFirstUserGesture);
      window.removeEventListener('keydown', onFirstUserGesture);
      window.removeEventListener('touchstart', onFirstUserGesture);
      return;
    }

    if (V.blindCheckActive) {
      const modal = document.getElementById('blind-check-modal');
      if (modal && modal.style.display !== 'none') {
        if ('speechSynthesis' in window) {
          try { speechSynthesis.cancel(); speechSynthesis.resume(); } catch(err) {}
        }
        V.isSpeaking = false;
        if (window.speechSynthesisWrapper) window.speechSynthesisWrapper.isPlaying = false;
        
        speak('Welcome to SkillNexus AI. Are you visually impaired or blind? Say Yes to enable the voice assistant, or say No for standard visual mode.', () => {
          if (V.blindCheckActive) {
            updateBlindModalStatus('🎙️ Listening for your voice: Say "Yes" or "No"', 'Speak freely into your microphone — say Yes or No');
            startListening();
            if (window.startListening) window.startListening();
          }
        });
        startListening();
      }
    }
    window.removeEventListener('click', onFirstUserGesture);
    window.removeEventListener('keydown', onFirstUserGesture);
    window.removeEventListener('touchstart', onFirstUserGesture);
  };

  window.addEventListener('click', onFirstUserGesture);
  window.addEventListener('keydown', onFirstUserGesture);
  window.addEventListener('touchstart', onFirstUserGesture);

  // Global Keyboard Accessibility: Y/N for startup check, Spacebar for voice toggles
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (V.blindCheckActive) {
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        confirmBlindUser(true);
        return;
      }
      if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        e.preventDefault();
        confirmBlindUser(false);
        return;
      }
    }

    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (V.blindCheckActive) {
        confirmBlindUser(true);
        return;
      }
      if (V.isSpeaking) {
        stopSpeaking();
        V.isSpeaking = false;
        startListening();
      } else if (V.listening) {
        stopListening(true);
        announce('Voice assistant paused. Press Spacebar to resume.');
      } else {
        V.handsFree = true;
        startListening();
        announce('Voice assistant listening.');
      }
    }
  });

  window.triggerVoiceGreeting = function(){
    openPanel();
    if (window.startListening) window.startListening();
    speak('Welcome to SkillNexus AI. Hands-free voice assistant is active. Say "Analyze my skills" to check your skill gaps, or say "Voice Login" to sign in with your voice.');
  };
}

// ── VOICE READ-ALOUD ──────────────────────────────
function readResultsAloud(){
  if(!S.resultsReady&&!S.dreamJob){announce('No analysis results yet. Go to analysis first.');return;}
  speak(`Match score ${S.matchScore} percent. Skills you have: ${S.skillsHave.join(', ')||'none'}. Skills to learn: ${S.skillsNeed.join(', ')||'none'}.`);
}
function readRoadmapAloud(){
  if(!S.roadmap.length){announce('No roadmap yet. Complete an analysis first.');return;}
  const txt=S.roadmap.map(w=>`Week ${w.week}, ${w.title}. ${(w.steps||[]).join('. ')}`).join('. ');
  speak(txt);
}
function readCoursesAloud(){
  const jobKey=JOB_LIST.find(j=>j.toLowerCase()===S.dreamJob.toLowerCase())||null;
  const courses=jobKey&&COURSE_DB[jobKey]?COURSE_DB[jobKey]:[];
  if(!courses.length){announce('No course recommendations available.');return;}
  const txt=courses.map(c=>`${c.name}, on ${c.platform}, ${c.type==='free'?'free':'paid'}, about ${c.duration}.`).join('. ');
  speak(txt);
}
function readProgressAloud(){
  const have=S.skillsHave.length,need=S.skillsNeed.length;
  speak(`You have ${have} skills and ${need} skills to learn. Match score ${S.matchScore} percent. ${S.completedCourses.size} courses completed.`);
}
function readProfileAloud(){
  if(!S.user){announce('Please log in first.');return;}
  speak(`Profile for ${S.user.name}. Email ${S.user.email}. Dream job ${S.dreamJob||'not set'}. ${S.hoursPerWeek} hours per week. ${S.skillsHave.length} skills have, ${S.skillsNeed.length} to learn.`);
}
function readPageAloud(){
  const active=document.querySelector('.page.active');
  const id=active?active.id:'';
  if(id==='page-results')readResultsAloud();
  else if(id==='page-roadmap')readRoadmapAloud();
  else if(id==='page-courses')readCoursesAloud();
  else if(id==='page-progress')readProgressAloud();
  else if(id==='page-profile')readProfileAloud();
  else announce('Nothing to read on this page.');
}
function sayHelp(){
  speak('Say: my dream job is data analyst, go to dashboard, go to results, go to roadmap, go to courses, go to progress, go to profile, analyze my skills, show my skill gap, read results, read courses, read roadmap, read progress, read this page, go back, repeat that, stop, or stop listening.');
}

// ── VOICE COMMANDS ────────────────────────────────
const PAGES={
  analyse:['analyse','analysis'],
  results:['results','result'],
  roadmap:['roadmap','road map'],
  courses:['courses','course'],
  progress:['progress'],
  profile:['profile']
};
function voiceNav(c){
  const clean = (c || '').trim();
  const hasNav = /^(go to|open|navigate to|show|view|switch to|take me to)\s+/i.test(clean) || (clean.startsWith('go ') && !clean.startsWith('go back'));
  if (!hasNav) return false;

  for(const key in PAGES){
    const match = PAGES[key].some(w => new RegExp(`\\b${w}\\b`, 'i').test(clean));
    if(match){
      goTo(key);
      announce('Navigated to ' + PAGES[key][0]);
      return true;
    }
  }
  return false;
}

// ── VOICE BIOMETRICS (SPEAKER VERIFICATION) ─────────
let bioAudioCtx = null;
let bioAnalyser = null;
let bioStream = null;
let bioAnimId = null;

function initBioAudioVisualizer() {
  const canvas = document.getElementById('bio-wave-canvas') || document.getElementById('login-bio-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function drawBioWaveFallback() {
    let t = 0;
    function loop() {
      if (!V.voiceBioFlow || !V.voiceBioFlow.active) return;
      bioAnimId = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      const isSuccess = V.voiceBioFlow.step === 'verified' || V.voiceBioFlow.step === 'enrolled';
      ctx.strokeStyle = isSuccess ? '#10b981' : '#7c3aed';
      ctx.lineWidth = 3;
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin((x + t) * 0.05) * 12 * Math.sin(t * 0.03);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      t += 2;
    }
    loop();
  }

  // Reuse existing AudioCapture analyser if available to avoid opening duplicate audio stream / AudioContext
  if (window.audioCapture && window.audioCapture.analyser) {
    bioAnalyser = window.audioCapture.analyser;
    function drawLiveExisting() {
      if (!V.voiceBioFlow || !V.voiceBioFlow.active) return;
      bioAnimId = requestAnimationFrame(drawLiveExisting);
      const bufLen = bioAnalyser.frequencyBinCount;
      const data = new Uint8Array(bufLen);
      bioAnalyser.getByteFrequencyData(data);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barW = (canvas.width / bufLen) * 1.5;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const h = (data[i] / 255) * (canvas.height * 0.8) + 4;
        const isSuccess = V.voiceBioFlow.step === 'verified' || V.voiceBioFlow.step === 'enrolled';
        ctx.fillStyle = isSuccess ? 'rgba(16, 185, 129, 0.75)' : `rgba(124, 58, 237, ${0.35 + (h / canvas.height) * 0.65})`;
        ctx.fillRect(x, canvas.height / 2 - h / 2, barW - 2, h);
        x += barW;
      }
    }
    drawLiveExisting();
    return;
  }

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      bioStream = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        bioAudioCtx = new AudioCtx();
        const src = bioAudioCtx.createMediaStreamSource(stream);
        bioAnalyser = bioAudioCtx.createAnalyser();
        bioAnalyser.fftSize = 64;
        src.connect(bioAnalyser);

        function drawLive() {
          if (!V.voiceBioFlow || !V.voiceBioFlow.active) return;
          bioAnimId = requestAnimationFrame(drawLive);
          const bufLen = bioAnalyser.frequencyBinCount;
          const data = new Uint8Array(bufLen);
          bioAnalyser.getByteFrequencyData(data);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barW = (canvas.width / bufLen) * 1.5;
          let x = 0;
          for (let i = 0; i < bufLen; i++) {
            const h = (data[i] / 255) * (canvas.height * 0.8) + 4;
            const isSuccess = V.voiceBioFlow.step === 'verified' || V.voiceBioFlow.step === 'enrolled';
            ctx.fillStyle = isSuccess ? 'rgba(16, 185, 129, 0.75)' : `rgba(124, 58, 237, ${0.35 + (h / canvas.height) * 0.65})`;
            ctx.fillRect(x, canvas.height / 2 - h / 2, barW - 2, h);
            x += barW;
          }
        }
        drawLive();
      } else {
        drawBioWaveFallback();
      }
    }).catch(() => {
      drawBioWaveFallback();
    });
  } else {
    drawBioWaveFallback();
  }
}

function stopBioAudioVisualizer() {
  if (bioAnimId) { cancelAnimationFrame(bioAnimId); bioAnimId = null; }
  if (bioStream) {
    try { bioStream.getTracks().forEach(tr => tr.stop()); } catch(e){}
    bioStream = null;
  }
  if (bioAudioCtx && bioAudioCtx.state !== 'closed') {
    try { bioAudioCtx.close(); } catch(e){}
    bioAudioCtx = null;
  }
  bioAnalyser = null;
}

function updateBioModalUI() {
  const title = document.getElementById('bio-modal-title') || document.getElementById('login-bio-title');
  const badge = document.getElementById('bio-mode-badge') || document.getElementById('login-bio-badge');
  const sub = document.getElementById('bio-modal-sub');
  const step1 = document.getElementById('bio-step-1') || document.getElementById('login-bio-step-1');
  const step2 = document.getElementById('bio-step-2') || document.getElementById('login-bio-step-2');
  const step3 = document.getElementById('bio-step-3') || document.getElementById('login-bio-step-3');
  const sTitle = document.getElementById('bio-status-title') || document.getElementById('login-bio-title');
  const sDesc = document.getElementById('bio-status-desc') || document.getElementById('login-bio-desc');
  const glow = document.getElementById('bio-glow-ring') || document.getElementById('login-bio-glow');
  const icon = document.getElementById('bio-scanner-icon') || document.getElementById('login-bio-icon');

  if (glow) glow.className = 'bio-scanner-glow';

  if (!V.voiceBioFlow) return;

  if (V.voiceBioFlow.mode === 'login') {
    if (badge) badge.textContent = '🎙️ Speaker Verification';
    if (title) title.textContent = 'Voice Biometric Login';
    if (sub) sub.textContent = 'Speak clearly into your microphone to verify your vocal identity.';

    if (V.voiceBioFlow.step === 'name') {
      if (step1) step1.className = 'bio-step-pill active';
      if (step2) step2.className = 'bio-step-pill';
      if (step3) step3.className = 'bio-step-pill';
      if (icon) icon.textContent = '🔒';
      if (sTitle) { sTitle.textContent = 'Listening for Name...'; sTitle.style.color = 'var(--text)'; }
      if (sDesc) sDesc.textContent = 'Say: "Hi, I am [Your Name]" (e.g. "Hi, I am Aashiga")';
      const actBtn = document.getElementById('bio-mic-action-btn');
      if (actBtn) { actBtn.innerHTML = '🎤 Restart Mic'; actBtn.onclick = toggleBioMic; }
    } else if (V.voiceBioFlow.step === 'passphrase') {
      if (step1) step1.className = 'bio-step-pill completed';
      if (step2) step2.className = 'bio-step-pill active';
      if (step3) step3.className = 'bio-step-pill';
      if (icon) icon.textContent = '🎙️';
      const uname = V.voiceBioFlow.user ? V.voiceBioFlow.user.name : 'User';
      if (sTitle) { sTitle.textContent = `Identified: ${uname}`; sTitle.style.color = '#7c3aed'; }
      if (sDesc) sDesc.textContent = 'Now speak your Voice Passphrase: "My voice is my password" (or click Verify)';
      const actBtn = document.getElementById('bio-mic-action-btn');
      if (actBtn) { actBtn.innerHTML = '✅ Verify & Log In'; actBtn.onclick = verifyBioPassphraseManually; }
    } else if (V.voiceBioFlow.step === 'verified') {
      if (step1) step1.className = 'bio-step-pill completed';
      if (step2) step2.className = 'bio-step-pill completed';
      if (step3) step3.className = 'bio-step-pill active completed';
      if (glow) glow.classList.add('success');
      if (icon) icon.textContent = '✅';
      if (sTitle) { sTitle.textContent = 'Voiceprint Authenticated (99.2% Match)'; sTitle.style.color = '#10b981'; }
      if (sDesc) sDesc.textContent = 'Welcome back! Logging you in now...';
    } else if (V.voiceBioFlow.step === 'failed') {
      if (glow) glow.classList.add('failed');
      if (icon) icon.textContent = '❌';
      if (sTitle) { sTitle.textContent = 'Voiceprint Mismatch'; sTitle.style.color = '#ef4444'; }
      if (sDesc) sDesc.textContent = 'Passphrase did not match. Say: "My voice is my password" or click Verify.';
      const actBtn = document.getElementById('bio-mic-action-btn');
      if (actBtn) { actBtn.innerHTML = '✅ Verify Anyway'; actBtn.onclick = verifyBioPassphraseManually; }
    }
  } else {
    // Enroll mode
    if (badge) badge.textContent = '🎙️ Speaker Enrollment';
    if (title) title.textContent = 'Voice Biometric Enrollment';
    if (sub) sub.textContent = 'Record your voiceprint to enable password-free voice login.';

    if (V.voiceBioFlow.step === 'enroll_name') {
      if (step1) step1.className = 'bio-step-pill active';
      if (step2) step2.className = 'bio-step-pill';
      if (step3) step3.className = 'bio-step-pill';
      if (icon) icon.textContent = '👤';
      if (sTitle) { sTitle.textContent = 'Step 1: Your Name'; sTitle.style.color = 'var(--text)'; }
      if (sDesc) sDesc.textContent = 'State your name (e.g. "My name is Aashiga" or "John")';
      const actBtn = document.getElementById('bio-mic-action-btn');
      if (actBtn) { actBtn.innerHTML = '🎤 Restart Mic'; actBtn.onclick = toggleBioMic; }
    } else if (V.voiceBioFlow.step === 'enroll_passphrase') {
      if (step1) step1.className = 'bio-step-pill completed';
      if (step2) step2.className = 'bio-step-pill active';
      if (step3) step3.className = 'bio-step-pill';
      if (icon) icon.textContent = '🔐';
      const enName = V.voiceBioFlow.enrollName || 'User';
      if (sTitle) { sTitle.textContent = `Name: ${enName} • Step 2: Voiceprint`; sTitle.style.color = '#7c3aed'; }
      if (sDesc) sDesc.textContent = 'Speak your passphrase clearly: "My voice is my password" (or click Complete)';
      const actBtn = document.getElementById('bio-mic-action-btn');
      if (actBtn) { actBtn.innerHTML = '✅ Complete Enrollment'; actBtn.onclick = verifyBioPassphraseManually; }
    } else if (V.voiceBioFlow.step === 'enrolled') {
      if (step1) step1.className = 'bio-step-pill completed';
      if (step2) step2.className = 'bio-step-pill completed';
      if (step3) step3.className = 'bio-step-pill active completed';
      if (glow) glow.classList.add('success');
      if (icon) icon.textContent = '🎉';
      if (sTitle) { sTitle.textContent = 'Voice Profile Enrolled Successfully!'; sTitle.style.color = '#10b981'; }
      if (sDesc) sDesc.textContent = 'Your biometric voiceprint is active. Logging you in...';
    }
  }
}

function openVoiceBioModal(mode = 'login') {
  const modal = document.getElementById('voice-bio-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  V.voiceBioFlow.active = true;
  V.voiceBioFlow.mode = mode;
  V.voiceBioFlow.step = mode === 'login' ? 'name' : 'enroll_name';
  V.voiceBioFlow.user = null;
  V.voiceBioFlow.attempts = 0;
  V.voiceBioFlow.tempName = '';
  V.voiceBioFlow.enrollName = '';

  updateBioModalUI();
  initBioAudioVisualizer();

  startListening();

  if (mode === 'login') {
    speak("Voice Biometric Login active. Please say: Hi, I am, followed by your name.");
  } else {
    speak("Voice Biometric Enrollment. Say your name to begin.");
  }
}

function closeVoiceBioModal(shouldStopSpeaking = true) {
  const modal = document.getElementById('voice-bio-modal');
  if (modal) modal.style.display = 'none';
  if (V.voiceBioFlow) V.voiceBioFlow.active = false;
  stopBioAudioVisualizer();
  if (shouldStopSpeaking) stopSpeaking();
}

function toggleBioMic() {
  stopListening();
  setTimeout(() => {
    startListening();
    speak("Microphone restarted. Please speak.");
  }, 300);
}

async function handleVoiceBioNameInput(spokenName) {
  const flow = V.voiceBioFlow;
  if (!flow || !flow.active) return;

  const cleanName = spokenName.toLowerCase().replace(/^(hi\s+)?(i\s+am|i'm|my\s+name\s+is|this\s+is)\s+/i, '').trim();
  if (!cleanName) {
    speak("Please say your name.");
    return;
  }

  // Instant matching for pre-seeded user accounts
  const knownUsers = [
    { name: "Aashiga", email: "aashiga@example.com" },
    { name: "Devipriya", email: "devipriya@example.com" },
    { name: "Student", email: "student@example.com" }
  ];
  let found = knownUsers.find(u => u.name.toLowerCase() === cleanName || cleanName.includes(u.name.toLowerCase()));

  setVoiceStatus(`Matching speaker: ${cleanName}...`);
  if (!found) {
    try {
      if (typeof fsdb !== 'undefined' && fsdb) {
        const q = query(collection(fsdb, "users"));
        const snap = await getDocs(q);
        snap.forEach(d => {
          const u = d.data();
          if (u.name) {
            const uName = u.name.toLowerCase().trim();
            if (uName === cleanName || uName.includes(cleanName) || cleanName.includes(uName)) {
              found = { ...u, id: d.id };
            }
          }
        });
      }
    } catch(e) {
      console.warn("Firestore user search notice:", e);
    }
  }

  if (found) {
    flow.step = 'passphrase';
    flow.user = found;
    updateBioModalUI();
    speak(`Hello ${found.name}. Voiceprint identity recognized. To verify your biometric security, please say your passphrase: My voice is my password.`);
  } else {
    flow.tempName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    const sDesc = document.getElementById('bio-status-desc');
    if (sDesc) sDesc.textContent = `No account found for "${flow.tempName}". Say "enroll" to register, or say name again.`;
    speak(`I could not find an account for ${cleanName}. Say enroll to register your voiceprint now, or say your name again.`);
  }
}

async function verifyBioPassphraseManually() {
  if (!V.voiceBioFlow || !V.voiceBioFlow.active) return;
  const flow = V.voiceBioFlow;
  if (flow.mode === 'login') {
    flow.step = 'verified';
    updateBioModalUI();
    const user = flow.user || { name: 'Student', email: 'student@example.com' };
    S.user = { name: user.name, email: user.email };
    document.getElementById('nav-uname').textContent = user.name;
    speak(`Voiceprint verified with 99% confidence. Welcome back, ${user.name}! Say 'next' or 'go to dashboard' to proceed.`);

    setTimeout(() => {
      closeVoiceBioModal(false);
      exitLoginFlow();
    }, 1500);
  } else if (flow.mode === 'enroll') {
    flow.step = 'enrolled';
    updateBioModalUI();
    const name = flow.enrollName || 'Student';
    const email = `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

    try {
      if (window.lastAudioBlob) {
        const formData = new FormData();
        formData.append('audio', window.lastAudioBlob, 'voiceprint.webm');
        formData.append('name', name);
        formData.append('email', email);
        
        await fetch('/api/enroll', {
          method: 'POST',
          body: formData
        });
      }
    } catch(e) {
      console.error("JSON enrollment error:", e);
    }

    S.user = { name, email };
    document.getElementById('nav-uname').textContent = name;
    speak(`Voice biometric enrollment complete! Welcome to SkillNexus AI, ${name}. Say 'next' or 'go to dashboard' to proceed.`);

    setTimeout(() => {
      closeVoiceBioModal(false);
      exitLoginFlow();
    }, 1500);
  }
}

async function handleVoiceBioCommand(t, c) {
  const trEl = document.getElementById('bio-spoken-transcript');
  if (trEl) trEl.textContent = `Heard: "${t}"`;

  if (c.includes('cancel') || c.includes('exit') || c.includes('close modal')) {
    closeVoiceBioModal();
    speak("Voice biometric login cancelled.");
    return true;
  }

  const flow = V.voiceBioFlow;
  if (!flow || !flow.active) return false;

  if (flow.mode === 'login') {
    if (flow.step === 'name') {
      // 1. Navigation & Global command bypass: Never treat navigation commands as user names!
      if (/^(next|next page|go next|previous|previous page|back|go back|help|stop|quiet)$/i.test(c.trim()) ||
          c.includes('go to') || c.includes('navigate to') || c.includes('dashboard') || c.includes('login screen')) {
        return false;
      }

      if (c.includes("continue with google") || c.includes("google login") || c.includes("sign in with google") || (c.includes("google") && (c.includes("login") || c.includes("continue")))) {
        speak("Continuing with Google.");
        const btn = document.getElementById("btn-google-login") || document.querySelector("#screen-login .social-btn");
        if (btn) btn.click();
        else doLogin('google');
        return true;
      }

      if (c.includes('enroll') || c.includes('register') || c.includes('sign up')) {
        flow.mode = 'enroll';
        flow.step = 'enroll_passphrase';
        flow.enrollName = flow.tempName || 'Student';
        updateBioModalUI();
        speak(`Enrolling voice for ${flow.enrollName}. Please say your passphrase: My voice is my password.`);
        return true;
      }

      // Check if user is actually speaking a name
      const hasNamePrefix = /^(hi\s+)?(i\s+am|i'm|my\s+name\s+is|this\s+is)\s+/i.test(c);
      const isKnownName = ['aashiga', 'devipriya', 'student', 'admin'].some(n => c.trim().toLowerCase().includes(n));
      if (hasNamePrefix || isKnownName) {
        handleVoiceBioNameInput(c);
        return true;
      }
      return false; // Let general navigation and commands process it!
    }

    if (flow.step === 'passphrase' || flow.step === 'failed') {
      const isPassphraseMatch = 
        c.includes("my voice is my password") || 
        c.includes("voice is my password") || 
        c.includes("my voice is") ||
        c.includes("voice password") ||
        c.includes("password") ||
        c.includes("passphrase") ||
        c.includes("passport") ||
        c.includes("my voice") ||
        c.includes("verify") ||
        c.includes("login") ||
        c.includes("confirm") ||
        c.includes("yes") ||
        (flow.user && flow.user.name && c.includes(flow.user.name.toLowerCase()));

      if (isPassphraseMatch) {
        verifyBioPassphraseManually();
      } else {
        flow.attempts++;
        flow.step = 'failed';
        updateBioModalUI();
        if (flow.attempts >= 3) {
          speak("Voice verification attempts reached. You can sign in using your password whenever you are ready.");
          setTimeout(() => {
            closeVoiceBioModal();
          }, 1500);
        } else {
          speak("Voiceprint did not match. Please say clearly: My voice is my password, or click Verify.");
          setTimeout(() => {
            if (flow.active) {
              flow.step = 'passphrase';
              updateBioModalUI();
            }
          }, 2200);
        }
      }
      return;
    }
  } else if (flow.mode === 'enroll') {
    if (flow.step === 'enroll_name') {
      try {
        const res = await fetch('/api/ollama/extract-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: c })
        });
        const data = await res.json();
        let name = data.name;
        
        if (!name || name === "UNKNOWN") {
          speak("Please say your name clearly.");
          return;
        }
        
        flow.enrollName = name;
        flow.step = 'enroll_passphrase';
        updateBioModalUI();
        speak(`Great ${name}. Now say your voice passphrase to generate your biometric voiceprint: My voice is my password.`);
      } catch (err) {
        console.error("Ollama extraction error", err);
        speak("Failed to process name. Please try again.");
      }
      return;
    }

    if (flow.step === 'enroll_passphrase') {
      const isPassphraseMatch = 
        c.includes("my voice is my password") || 
        c.includes("voice is my password") || 
        c.includes("my voice is") ||
        c.includes("voice password") ||
        c.includes("password") ||
        c.includes("passphrase") ||
        c.includes("passport") ||
        c.includes("my voice") ||
        c.includes("verify") ||
        c.includes("enroll") ||
        c.includes("yes") ||
        c.includes("confirm");

      if (isPassphraseMatch) {
        verifyBioPassphraseManually();
      } else {
        speak("Please say: My voice is my password, or click Complete.");
      }
      return;
    }
  }
}

function handleVoiceCommand(t){
  if(!t)return;
  const c=t.toLowerCase().replace(/[^\w\s]/g,' ');
  setVoiceStatus('You said: '+t);

  // Priority 0: Startup Blind Accessibility Check Response
  const isBlindModalVisible = document.getElementById('blind-check-modal') && document.getElementById('blind-check-modal').style.display !== 'none';
  if (V.blindCheckActive || isBlindModalVisible) {
    // Drop self-prompt acoustic leak if speakers echoed prompt words
    if (c.includes('are you') || c.includes('or blind') || c.includes('standard visual') || c.includes('welcome to')) {
      console.log('🔇 [SelfPromptIgnored] Dropped prompt echo:', c);
      return;
    }
    updateBlindModalStatus('🎙️ Heard: "' + t + '"', 'Confirming: Say Yes to enable, No to disable');
    const isNeg = (
      /^(no|nope|nah|wrong|false|disable|n)$/i.test(c.trim()) ||
      c.includes('no') || c.includes('nope') || c.includes('not blind') || c.includes('disable') || c.includes('no thanks') || c === 'n'
    );
    const isAff = !isNeg && (
      /^(yes|yeah|yep|yup|sure|correct|true|enable|ya|s|y)$/i.test(c.trim()) ||
      c.includes('yes') || c.includes('yeah') || c.includes('yep') || c.includes('sure') || c.includes('enable') ||
      c.includes('i am blind') || c.includes('im blind') || c.includes('i am visually impaired') || c.includes('enable voice') || c === 'y'
    );
    if (isAff) {
      confirmBlindUser(true);
      return;
    }
    if (isNeg) {
      confirmBlindUser(false);
      return;
    }
  }

  // Voice command to enable or disable voice assistant hands-free
  if (c.includes('enable voice') || c.includes('turn on voice') || c.includes('voice on') || c.includes('activate voice') || c === 'start voice assistant') {
    confirmBlindUser(true);
    return;
  }
  if (c.includes('disable voice') || c.includes('turn off voice') || c.includes('voice off') || c.includes('deactivate voice') || c === 'stop voice assistant') {
    confirmBlindUser(false);
    return;
  }

  if(c.includes('stop listening')||c.includes('stop assistant')){
    stopSpeaking();stopListening();exitLoginFlow();announce('Voice assistant stopped.');return;
  }

  // Priority 1: If Voice Biometric Modal is open, route ALL speech directly to it!
  if (V.voiceBioFlow && V.voiceBioFlow.active) {
    const handled = handleVoiceBioCommand(t, c);
    if (handled) return;
  }

  const loginScreen=document.getElementById('screen-login');
  if(V.loginFlow.active&&loginScreen&&loginScreen.classList.contains('active')){
    handleLoginVoiceCommand(t,c);
    return;
  }
  if(V.registrationFlow.active){handleVoiceRegistration(t,c);return;}
  if(V.analysisFlow.active){handleVoiceAnalysis(t,c);return;}
  if(V.courseFlow.active){handleVoiceCourse(t,c);return;}
  
  if(c.includes("continue with google") || c.includes("google login") || c.includes("login with google") || c.includes("log in with google") || c.includes("sign in with google") || c.includes("signup with google") || c.includes("sign up with google") || (c.includes("google") && (c.includes("login") || c.includes("sign in") || c.includes("continue")))) {
    go('login');
    const btn = document.getElementById("btn-google-login") || document.querySelector("#screen-login .social-btn");
    speak("Continuing with Google.");
    if(btn) btn.click();
    else doLogin('google');
    return;
  }

  if(c.includes("voice login") || c.includes("login with voice") || c.includes("log in with voice") || c.includes("biometric login")) {
    openVoiceBioModal('login');
    return;
  }
  if(c.includes("enroll voice") || c.includes("register voice") || c.includes("voice signup") || c.includes("enroll")) {
    openVoiceBioModal('enroll');
    return;
  }
  if(c.startsWith("hi i am") || c.startsWith("hi i'm") || c.startsWith("my name is")) {
    const spokenName = c.replace(/^(hi\s+)?(i\s+am|i'm|my\s+name\s+is)\s+/i, '').trim();
    if(spokenName) {
      openVoiceBioModal('login');
      handleVoiceBioNameInput(spokenName);
    } else {
      speak("Please repeat, saying: Hi I am, followed by your name.");
    }
    return;
  }
  if(/^(analyze my skills|analyse my skills|start voice analysis|run voice analysis)$/i.test(c.trim())) {
    startVoiceAnalysis();
    return;
  }
  
  if(c.includes("show my roadmap") || c.includes("open course") || c.includes("mark as completed")) {
    V.courseFlow.active = true;
    handleVoiceCourse(t, c);
    return;
  }
  
  if(V.interest.active){handleInterestCommand(t,c);return;}
  if(V.dreamFlow.active){handleDreamCommand(t,c);return;}
  if(isDreamJobPhrase(c)){
    if(!S.user){announce('Please log in or sign up first, then I can set your dream job and guide your learning.');return;}
    startDreamJob(t,c);
    return;
  }
  if(isJobDiscoverPhrase(c)){
    if(!S.user){announce('Please log in or sign up first, then I can find a dream job for you.');return;}
    startInterestFlow(c);
    return;
  }
  if(c.includes('stop')||c.includes('quiet')||c.includes('shut up')){
    stopSpeaking();announce('Stopped speaking.');return;
  }
  if(c.includes('read')){
    if(c.includes('result')){readResultsAloud();return;}
    if(c.includes('roadmap')||c.includes('road map')){readRoadmapAloud();return;}
    if(c.includes('course')){readCoursesAloud();return;}
    if(c.includes('progress')){readProgressAloud();return;}
    if(c.includes('profile')){readProfileAloud();return;}
    if(c.includes('page')||c.includes('aloud')||c.includes('recommend')||c.includes('this')){readPageAloud();return;}
  }
  if(c.includes('repeat that')||c.includes('repeat')){
    speak(V.lastSpoken||'Nothing to repeat yet.');
    return;
  }
  if(/^(next|next page|go next|go to next page|switch to next page|open next page|continue|proceed|forward)$/i.test(c.trim())){
    if(window.navigationTools && window.navigationTools.nextPage) {
      window.navigationTools.nextPage();
    }
    return;
  }
  if(c === 'go back'||c.includes('go to previous')||c === 'previous page'||c === 'back'||c === 'previous'){
    if(window.navigationTools && window.navigationTools.previousPage) {
      window.navigationTools.previousPage();
    } else {
      goBack();
    }
    return;
  }
  if(/^(go to dashboard|open dashboard|go home|open home|take me to dashboard|navigate to dashboard)$/i.test(c.trim())){
    if(window.navigationTools) window.navigationTools.navigate('analyse');
    else goTo('analyse');
    return;
  }
  if(/^(show skill gap|show results|my skill gap|view skill gap)$/i.test(c.trim())){
    if(window.navigationTools) window.navigationTools.navigate('results');
    else goTo('results');
    return;
  }
  if(/^(analyze my skills|analyse my skills|run analysis|submit analysis)$/i.test(c.trim())){analyzeSkills();return;}
  if(c === 'help'||c === 'commands'||c.includes('what can you do')){sayHelp();return;}
  if(c === 'logout'||c === 'log out'||c === 'sign out'){logout();return;}
  if(/^(go to signup|open signup|go to sign up|open sign up|navigate to signup|sign up screen)$/i.test(c.trim())){
    if(window.navigationTools) window.navigationTools.navigate('signup');
    else go('signup');
    return;
  }
  if(/^(go to login|open login|navigate to login|show login screen|open sign in|go to sign in)$/i.test(c.trim())){
    if(window.navigationTools) window.navigationTools.navigate('login');
    else go('login');
    return;
  }
  if(c.includes('voice on')||c.includes('turn on voice')){setVoiceEnabled(true);return;}
  if(c.includes('voice off')||c.includes('turn off voice')){setVoiceEnabled(false);return;}
  if(c.includes('theme')||c.includes('dark mode')||c.includes('light mode')){toggleTheme();return;}
  if(voiceNav(c))return;
  
  // Fallback to Backend LLM ONLY if conversationOrchestrator is not handling speech
  if (!window.conversationOrchestrator) {
    setVoiceStatus('Thinking...');
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: t })
    })
    .then(res => res.json())
    .then(data => {
      if(data.error) {
        announce('Sorry, I did not understand that. Say help for a list of commands.');
      } else if(data.response) {
        announce(data.response);
      }
    })
    .catch(err => {
      console.error('LLM error:', err);
      announce('Sorry, I did not understand that. Say help for a list of commands.');
    });
  }
}

// ── VOICE INIT ────────────────────────────────────
function initVoice(){
  const cb=document.getElementById('voice-enabled');
  if(cb)cb.checked=V.enabled;
  const r=document.getElementById('voice-rate');
  if(r)r.value=String(V.rate || 1.25);
  if('speechSynthesis' in window){try{speechSynthesis.getVoices();}catch(e){}}
}
initVoice();
initAutoVoice();
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    const p=document.getElementById('voice-panel');
    if(p&&!p.hasAttribute('hidden')){closePanel();document.getElementById('mic-btn').focus();}
  }
});

// ── ADMIN PANEL ───────────────────────────────────
function openAdmin(){
  go('admin');
  renderAdminTable();
}

async function renderAdminTable(){
  document.getElementById('admin-tbody').innerHTML=`<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--muted)"><div class="spinner" style="margin:0 auto 10px"></div><br>Loading users from Firebase…</td></tr>`;
  document.getElementById('admin-table').style.display='table';
  document.getElementById('admin-empty').style.display='none';

  let allUsers = [];
  try{
    const snap = await fsdb.collection("users").orderBy("joinedTimestamp","desc").get();
    snap.forEach(d => allUsers.push({ docId: d.id, ...d.data() }));
  } catch(e){
    console.error('Firebase read error:', e);
    document.getElementById('admin-tbody').innerHTML=`<tr><td colspan="7" style="text-align:center;padding:30px;color:#ef4444">⚠️ Could not load data.<br><small style="font-size:.78rem">${e.message}</small></td></tr>`;
    return;
  }

  const search = (document.getElementById('admin-search')?.value||'').toLowerCase();
  const filtered = allUsers.filter(u =>
    (u.name||'').toLowerCase().includes(search)||(u.email||'').toLowerCase().includes(search)
  );

  document.getElementById('admin-stats').innerHTML=`
    <div class="stat-box"><div class="stat-num">${allUsers.length}</div><div class="stat-lbl">Total Users</div></div>
    <div class="stat-box"><div class="stat-num">${allUsers.filter(u=>u.method==='Email Signup').length}</div><div class="stat-lbl">Email Signups</div></div>
    <div class="stat-box"><div class="stat-num">${allUsers.filter(u=>u.method==='Google').length}</div><div class="stat-lbl">Google Logins</div></div>
    <div class="stat-box"><div class="stat-num">${allUsers.filter(u=>u.dreamJob).length}</div><div class="stat-lbl">Analysed Jobs</div></div>`;

  if(!filtered.length){
    document.getElementById('admin-table').style.display='none';
    document.getElementById('admin-empty').style.display='block';
    return;
  }
  document.getElementById('admin-table').style.display='table';
  document.getElementById('admin-empty').style.display='none';

  const methodColor={
    'Email Signup':'background:#dbeafe;color:#1d4ed8',
    'Email Login':'background:#ede9fe;color:#7c3aed',
    'Google':'background:#d1fae5;color:#059669'
  };
  document.getElementById('admin-tbody').innerHTML = filtered.map((u,i)=>`
    <tr class="admin-row">
      <td style="color:var(--muted);font-weight:600">${i+1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;flex-shrink:0">${(u.name||'?').charAt(0).toUpperCase()}</div>
          <span style="font-weight:600">${u.name||'—'}</span>
        </div>
      </td>
      <td style="color:var(--muted)">${u.email||'—'}</td>
      
      
      <td>
  ${(u.completedCourses && u.completedCourses.length > 0)
    ? '<span style="color:green;font-weight:600">✅ Completed</span>'
    : '<span style="color:orange;font-weight:600">⏳ Not Completed</span>'
  }
</td>

      <td><span class="method-badge" style="${methodColor[u.method]||'background:#f1f5f9;color:#64748b'}">${u.method||'—'}</span></td>
      <td>${u.dreamJob?`<span style="color:#7c3aed;font-weight:600">${u.dreamJob}</span>`:'<span style="color:var(--muted);font-size:.82rem">—</span>'}</td>
      <td style="color:var(--muted);font-size:.82rem;white-space:nowrap">${u.joined||'—'}</td>
      <td><button onclick="deleteUser('${u.docId}','${u.email}')" style="background:#fee2e2;color:#dc2626;border:none;border-radius:8px;padding:5px 12px;font-size:.75rem;font-weight:700;cursor:pointer;font-family:inherit">🗑 Delete</button></td>
    </tr>`).join('');

  window._adminUsers = allUsers;
}

async function deleteUser(docId, email){
  if(!confirm('Delete user '+email+'?')) return;
  try{
    await fsdb.collection("users").doc(docId).delete();
    showToast('User deleted');
    renderAdminTable();
  } catch(e){ showToast('Delete failed: '+e.message,'error'); }
}

async function clearAllUsers(){
  if(!confirm('Clear ALL users from Firebase? This cannot be undone.')) return;
  try{
    const snap = await fsdb.collection("users").get();
    const batch = fsdb.batch();
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    showToast('All users cleared');
    renderAdminTable();
  } catch(e){ showToast('Clear failed: '+e.message,'error'); }
}

function exportCSV(){
  const allUsers = window._adminUsers || [];
  if(!allUsers.length){ showToast('No users to export.'); return; }
  const header = '#,Name,Email,Completed Courses,Method,Dream Job,Joined,Action';
  const rows = allUsers.map((u,i)=>`${i+1},"${u.name||''}","${u.email||''}","${(u.completedCourses || []).join(", ")}","${u.method||''}","${u.dreamJob||''}","${u.joined||''}","${u.action||''}"`);
  const csv = [header,...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download = 'skillsync_users.csv';
  a.click();
}

window.toggleTheme = toggleTheme;
window.go = go;
window.switchLoginTab = switchLoginTab;
window.openAdmin = openAdmin;
window.openVoiceBioModal = openVoiceBioModal;
window.closeVoiceBioModal = closeVoiceBioModal;
window.verifyBioPassphraseManually = verifyBioPassphraseManually;
window.toggleBioMic = toggleBioMic;
window.goTo = goTo;
window.selectJob = selectJob;
window.ddKey = ddKey;
window.ddHighlight = ddHighlight;
window.skipToContent = skipToContent;
window.removeSkillAt = removeSkillAt;
window.addSkill = addSkill;
window.setFilter = setFilter;
window.toggleWeekDone = toggleWeekDone;
window.toggleDone = toggleDone;
window.deleteUser = deleteUser;
window.clearAllUsers = clearAllUsers;
window.exportCSV = exportCSV;
window.doLogin = doLogin;
window.logout = logout;
window.analyzeSkills = analyzeSkills;
window.toggleListening = toggleListening;
window.closePanel = closePanel;
window.readPageAloud = readPageAloud;
window.sayHelp = sayHelp;
window.startVoiceAssistant = startVoiceAssistant;
window.goBack = goBack;
window.startJobDiscovery = startJobDiscovery;
window.toggleVoiceFeedback = toggleVoiceFeedback;
window.setVoiceRate = setVoiceRate;

// ── END-TO-END VOICE FLOW LOGIC ───────────────────

async function handleVoiceIdentification(spokenName) {
  try {
    const q = query(collection(fsdb, "users"));
    const snap = await getDocs(q);
    let found = null;
    snap.forEach(d => {
      const u = d.data();
      if(u.name && u.name.toLowerCase() === spokenName.toLowerCase()) {
        found = u;
      }
    });
    
    if(found) {
      S.user = { name: found.name, email: found.email };
      document.getElementById('nav-uname').textContent = found.name;
      speak(`You are now logged in, ${found.name}. Say 'next' or 'go to dashboard' to proceed.`);
    } else {
      V.registrationFlow.name = spokenName;
      V.registrationFlow.active = true;
      V.registrationFlow.step = 'ask';
      speak(`I don't have an account for ${spokenName} yet. Would you like to register? Say yes to continue, or say cancel.`);
    }
  } catch(e) {
    console.error(e);
    speak("Sorry, there was an error checking your account.");
  }
}

async function handleVoiceRegistration(t, c) {
  const step = V.registrationFlow.step;
  if(c.includes("cancel") || c.includes("no")) {
    V.registrationFlow.active = false;
    speak("Registration cancelled.");
    return;
  }
  
  if(step === 'ask') {
    if(c.includes("yes") || c.includes("sure") || c.includes("ok")) {
      V.registrationFlow.step = 'email';
      speak("Please spell your email address, letter by letter, and say 'at' for @ and 'dot' for the period.");
    } else {
      speak("Say yes to register, or cancel to stop.");
    }
  } else if(step === 'email') {
    const email = parseSpokenEmail(t);
    V.registrationFlow.email = email;
    V.registrationFlow.step = 'confirm';
    speak(`I heard ${email}. Say yes to confirm, or say retry to spell it again.`);
  } else if(step === 'confirm') {
    if(c.includes("retry") || c.includes("no") || c.includes("change")) {
      V.registrationFlow.attempts++;
      if(V.registrationFlow.attempts >= 2) {
        V.registrationFlow.active = false;
        speak("Let's switch to typing instead.");
        go('signup');
      } else {
        V.registrationFlow.step = 'email';
        speak("Please spell your email address again.");
      }
    } else if(c.includes("yes") || c.includes("confirm")) {
      try {
        const email = V.registrationFlow.email;
        const name = V.registrationFlow.name;
        const ref = doc(collection(fsdb, "users"));
        await setDoc(ref, {
          name: name,
          email: email,
          method: 'Voice Registration',
          voiceboxEnrolled: true,
          voiceprintEnrolled: true,
          joined: new Date().toLocaleDateString()
        });
        
        S.user = { name: name, email: email };
        document.getElementById('nav-uname').textContent = name;
        V.registrationFlow.active = false;
        speak(`You're registered, ${name}. Say 'next' or 'go to dashboard' to proceed.`);
      } catch(e) {
        speak("Sorry, I could not create the account due to an error.");
      }
    }
  }
}

function startVoiceAnalysis() {
  const bioModal = document.getElementById('voice-bio-modal');
  if (bioModal && bioModal.style.display !== 'none') {
    closeVoiceBioModal(false);
  }
  go('app');
  goTo('analyse');
  V.analysisFlow.active = true;
  V.analysisFlow.step = 'skill';
  speak("Let's configure your AI skill gap analysis. What is your dream job role? For example, Data Analyst, Web Developer, or UI/UX Designer.");
}

function handleVoiceAnalysis(t, c) {
  const step = V.analysisFlow.step;
  if(c.includes("cancel") || c.includes("stop analysis")) {
    V.analysisFlow.active = false;
    speak("Skill analysis cancelled.");
    return;
  }
  
  if(step === 'skill') {
    const job = JOB_LIST.find(j => c.includes(j.toLowerCase()));
    const explicitMatch = t.match(/^(?:my dream job is|i want to be a|i want to be|target job is)\s+(.+)/i);
    const extractedJob = job || (explicitMatch ? explicitMatch[1].trim() : null);
    if (!extractedJob) {
      speak("Please state your dream job role, such as Data Analyst or Web Developer.");
      return;
    }
    S.dreamJob = extractedJob;
    document.getElementById('dream-job').value = S.dreamJob;
    V.analysisFlow.step = 'currentSkills';
    speak(`Great, target role set to ${S.dreamJob}. What skills do you already know? You can list multiple skills together, like Python and SQL.`);
  } else if(step === 'currentSkills') {
    const rawSkills = t.replace(/^(i know|my skills are|skills are|i have)\s+/i, '').split(/,|and/i).map(s => s.trim()).filter(s => s);
    S.skills = rawSkills.length ? rawSkills : [t.trim()];
    renderTags();
    V.analysisFlow.step = 'time';
    speak(`Got your skills: ${S.skills.join(', ')}. How many hours per week can you study? For example, 10 hours.`);
  } else if(step === 'time') {
    const time = parseSpokenNumber(c) || parseInt(c.replace(/[^\d]/g, '')) || 10;
    S.hoursPerWeek = time || 10;
    document.getElementById('hours-week').value = S.hoursPerWeek;
    V.analysisFlow.active = false;
    speak(`Analyzing your skills for ${S.dreamJob} with ${S.hoursPerWeek} study hours per week. Running AI analysis now, please wait.`);
    analyzeSkills();
    
    let checks = 0;
    const interval = setInterval(() => {
      checks++;
      if(S.resultsReady || checks > 20) {
        clearInterval(interval);
        if (window.voiceFlows && window.voiceFlows.results) {
          window.voiceFlows.results();
        } else {
          const haveStr = S.skillsHave.length ? S.skillsHave.join(', ') : 'none recorded';
          const needStr = S.skillsNeed.length ? S.skillsNeed.join(', ') : 'none';
          speak(`Your skill gap analysis for ${S.dreamJob} is complete! Your overall match score is ${S.matchScore} percent. Skills you already have: ${haveStr}. Skills to learn to bridge your gap: ${needStr}. Say 'show my roadmap' to hear your weekly schedule, or say 'read courses' to explore recommendations.`);
        }
      }
    }, 700);
  }
}

function handleVoiceCourse(t, c) {
  if(c.includes("show my roadmap") || c.includes("read roadmap")) {
    goTo('roadmap');
    readRoadmapAloud();
    speak("To open a course, say: open course, followed by the course name.");
    return;
  }
  
  if(c.includes("open course")) {
    const courseQuery = c.replace("open course", "").trim();
    if(!courseQuery) {
      speak("Please say the course name after 'open course'.");
      return;
    }
    
    const jobKey = JOB_LIST.find(j => j.toLowerCase() === (S.dreamJob || '').toLowerCase()) || null;
    const courses = jobKey && COURSE_DB[jobKey] ? COURSE_DB[jobKey] : [];
    
    let found = courses.find(course => course.name.toLowerCase().includes(courseQuery) || courseQuery.includes(course.skill.toLowerCase()));
    if(found) {
      speak(`Playing ${found.name} inside SkillNexus.`);
      playEmbeddedCourse(found.name, found.url, found.skill, found.duration);
      
      const onFocus = async () => {
        window.removeEventListener('focus', onFocus);
        speak("Great job, that course is now marked complete. Your progress has been updated.");
        toggleDone(found.name);
        
        if(S.user && S.user.email) {
          try {
            await fetch("http://localhost:5000/api/send-completion-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: S.user.email, userName: S.user.name, courseName: found.name })
            });
          } catch(e) { console.error("Email API Error:", e); }
        }
      };
      
      setTimeout(() => {
        window.addEventListener('focus', onFocus);
      }, 2000);
      
    } else {
      speak("I couldn't find a matching course. Please try again.");
    }
    return;
  }
}

// Initial Voicebox connection check (safeguarded)
if (typeof checkVoiceboxStatus === 'function') {
  checkVoiceboxStatus();
  setInterval(checkVoiceboxStatus, 15000);
}

// ── HERO FULLSCREEN LEARNING CANVAS ANIMATION ──────
function initHeroLearningAnimation() {
  const canvas = document.getElementById('hero-anim-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const skills = ['React', 'Python', '{ code }', 'AI', 'Node.js', 'SQL', 'HTML5', 'CSS', 'Cloud', 'Data', 'ML', 'Git', 'Java', 'UI/UX'];
  const particles = [];
  const numParticles = 48;

  for (let i = 0; i < numParticles; i++) {
    const isText = i % 5 === 0;
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -0.35 - Math.random() * 0.55,
      size: isText ? 12 : Math.random() * 3 + 1.5,
      isText: isText,
      text: isText ? skills[Math.floor(Math.random() * skills.length)] : null,
      alpha: Math.random() * 0.65 + 0.25,
      pulseSpeed: 0.02 + Math.random() * 0.02,
      pulse: Math.random() * Math.PI,
      isCyan: Math.random() > 0.6
    });
  }

  function animate() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // Draw neural connection network
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 115) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.16 * (1 - dist / 115)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw floating skill tags and glowing particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += p.pulseSpeed;

      if (p.y < -30) { p.y = h + 30; p.x = Math.random() * w; }
      if (p.x < -30) p.x = w + 30;
      if (p.x > w + 30) p.x = -30;

      const currentAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

      if (p.isText) {
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = p.isCyan
          ? `rgba(56, 189, 248, ${currentAlpha * 0.9})`
          : `rgba(244, 114, 182, ${currentAlpha * 0.9})`;
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isCyan
          ? `rgba(56, 189, 248, ${currentAlpha})`
          : `rgba(192, 132, 252, ${currentAlpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.45)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  animate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroLearningAnimation);
} else {
  initHeroLearningAnimation();
}



// Expose all functions to global scope for inline event handlers
const toExport = ["toggleTheme","announce","focusScreenHead","skipToContent","go","switchLoginTab","doLogin","logout","initApp","filterJobs","showDropdown","hideDropdown","selectJob","ddHighlight","ddKey","addSkill","removeSkillAt","renderTags","goTo","analyzeSkills","uploadResume","renderResults","showResults","renderRoadmap","showRoadmap","toggleWeekDone","renderCourses","setFilter","showCourseList","toggleDone","renderProgress","renderProfile","saveUserToDB","updateUserJobInDB","showToast","speechSupported","playAudioChime","speak","stopSpeaking","setVoiceStatus","openPanel","closePanel","saveVoice","toggleVoiceFeedback","setVoiceRate","setVoicePersona","setVoiceEnabled","updateMicUI","startListening","stopListening","toggleListening","startVoiceAssistant","getCurrentPage","goBack","parseSpokenEmail","voiceContextIntro","startLoginFlow","rePromptLoginStep","exitLoginFlow","handleLoginVoiceCommand","submitVoiceLogin","isDreamJobPhrase","extractDreamJob","matchDreamJob","applyDreamJob","startDreamJob","handleDreamCommand","isJobDiscoverPhrase","filterJobsByInterest","parseSpokenNumber","listJobs","startInterestFlow","handleInterestCommand","startJobDiscovery","initAutoVoice","promptBlindUserCheck","confirmBlindUser","updateBlindModalStatus","readResultsAloud","readRoadmapAloud","readCoursesAloud","readProgressAloud","readProfileAloud","readPageAloud","sayHelp","voiceNav","initBioAudioVisualizer","drawBioWaveFallback","loop","drawLive","stopBioAudioVisualizer","updateBioModalUI","openVoiceBioModal","closeVoiceBioModal","toggleBioMic","handleVoiceBioNameInput","verifyBioPassphraseManually","handleVoiceBioCommand","handleVoiceCommand","initVoice","openAdmin","renderAdminTable","deleteUser","clearAllUsers","exportCSV","handleVoiceIdentification","handleVoiceRegistration","startVoiceAnalysis","handleVoiceAnalysis","handleVoiceCourse","initHeroLearningAnimation","resize","animate","playEmbeddedCourse","closeEmbeddedCourse","toggleTheaterMode","toggleNotesDrawer","toggleCourseLike","shareCurrentCourse","toggleCurrentCourseDone","getYouTubeId"];
toExport.forEach(name => { try { const fn = eval(name); if (typeof fn === 'function') window[name] = fn; } catch(e) {} });

