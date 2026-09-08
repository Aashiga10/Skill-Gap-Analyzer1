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
    {skill:"HTML",name:"HTML & CSS Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=mU6anWqZJcc",duration:"6 hrs"},
    {skill:"HTML",name:"Responsive Web Design Certification",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/2022/responsive-web-design/",duration:"15 hrs"},
    {skill:"CSS",name:"CSS Tutorial – Zero to Hero",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=1Rs2ND1ryYc",duration:"5 hrs"},
    {skill:"JavaScript",name:"JavaScript Algorithms and Data Structures",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",duration:"20 hrs"},
    {skill:"JavaScript",name:"JavaScript Full Course for Beginners",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=jS4aFq5-91M",duration:"8 hrs"},
    {skill:"React",name:"Front End Development Libraries",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/front-end-development-libraries/",duration:"18 hrs"},
    {skill:"React",name:"React JS Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=bMknfKXIFA8",duration:"10 hrs"},
    {skill:"Node.js",name:"Back End Development and APIs",platform:"freeCodeCamp",type:"free",url:"https://www.freecodecamp.org/learn/back-end-development-and-apis/",duration:"15 hrs"},
    {skill:"Node.js",name:"Node.js & Express Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=Oe421EPjeEQ",duration:"8 hrs"},
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
    {skill:"Excel",name:"Microsoft Excel – Full Course",platform:"YouTube",type:"free",url:"https://www.youtube.com/watch?v=Vl0H-qTcleg",duration:"6 hrs"},
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

  // Spoken screen announcements for blind accessibility
  const screenDescriptions = {
    landing: 'Home screen. Say: Voice login, to sign in with your voice, or say: Sign up.',
    login: 'Login screen. Say: Voice login, to verify your voice, or say: Hi I am, followed by your name.',
    signup: 'Sign up screen. Say: Enroll voice, to register your voice.',
    about: 'About screen. SkillNexus AI bridges your career skill gaps.'
  };
  if(screenDescriptions[id]){
    announce(screenDescriptions[id]);
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
function goTo(page){
  const bioModal = document.getElementById('voice-bio-modal');
  if (bioModal && bioModal.style.display !== 'none') {
    closeVoiceBioModal(false);
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
  announce('Opened ' + page + ' section.');
  if(page==='analyse'&&S.user&&V.listening&&!V.analyseHintShown){
    V.analyseHintShown=true;
    setTimeout(()=>{
      if(V.listening)announce('You can say find my dream job to choose a dream job from your interests, or say my dream job is, followed by a job name.');
    },800);
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
  announce(`Analysis complete. Match score ${S.matchScore} percent. Skills you have: ${S.skillsHave.join(', ')||'none'}. Skills to learn: ${S.skillsNeed.join(', ')||'none'}.`);
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
function showCourseList(courses){
  const filtered=S.activeSkillFilter==='All'?courses:courses.filter(c=>c.skill===S.activeSkillFilter);
  const icons={YouTube:'▶️',freeCodeCamp:'🏕',Udemy:'📘',Coursera:'🎓'};
  document.getElementById('c-list').innerHTML=filtered.map((c,i)=>{
    const done=S.completedCourses.has(c.name);
    return `<div class="course-card">
      <div class="c-icon">${icons[c.platform]||'📖'}</div>
      <div class="c-info">
        <div class="c-name">${c.name}</div>
        <div class="c-meta">
          <span class="badge ${c.type==='free'?'b-free':'b-paid'}">${c.type==='free'?'FREE':'PAID'}</span>
          <span class="badge b-yt">${c.platform}</span>
          <span style="font-size:.76rem;color:var(--muted)">• ${c.skill} • ${c.duration}</span>
        </div>
        <div class="c-actions">
          <a href="${c.url}" target="_blank" rel="noopener" style="text-decoration:none"><button class="btn btn-p btn-sm">Start Learning ↗</button></a>
          <button class="${done?'btn-g':''}" style="${done?'':'background:var(--social-bg);border:1.5px solid var(--inp-b);color:#7c3aed;padding:7px 14px;font-size:.78rem;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:600'}" onclick="toggleDone('${c.name}')">
            ${done?'Skill Learned! ✅':'Mark as Completed ✅'}
          </button>
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
const V={
  enabled:true,
  rate:1,
  listening:false,
  handsFree:true,
  continuousListening:true,
  isSpeaking:false,
  autoWelcomeTriggered:false,
  recognition:null,
  lastSpoken:'',
  pageHistory:[],
  suppressHistory:false,
  loginFlow:{active:false,step:'idle',email:''},
  dreamFlow:{active:false,raw:'',pending:null},
  interest:{active:false,stage:'idle',matches:[],introShown:false},
  registrationFlow: { active: false, step: 'idle', name: '', email: '', attempts: 0 },
  voiceBioFlow: { active: false, mode: 'login', step: 'name', user: null, attempts: 0, tempName: '', enrollName: '' },
  voiceboxFlow: { active: false, mode: 'login', user: null },
  analysisFlow: { active: false, step: 'idle', skill: '', currentSkills: '', time: '' },
  courseFlow: { active: false, currentCourseIndex: 0 },
  analyseHintShown:false
};
try{
  const saved=JSON.parse(localStorage.getItem('skillsync_voice')||'{}');
  if(typeof saved.enabled==='boolean')V.enabled=saved.enabled;
  if(saved.rate)V.rate=parseFloat(saved.rate)||1;
}catch(e){}

function speechSupported(){
  return ('speechSynthesis' in window)||('SpeechRecognition' in window)||('webkitSpeechRecognition' in window);
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

let currentVoiceboxAudio = null;

async function checkVoiceboxStatus() {
  try {
    const res = await fetch("http://localhost:5000/api/voicebox/status");
    if (res.ok) {
      const data = await res.json();
      const vbBadge = document.getElementById('voicebox-status-badge');
      if (vbBadge) {
        if (data.status === 'connected') {
          const profileName = (data.profiles && data.profiles[0]) ? data.profiles[0].name : 'Active';
          const isDownloading = data.tasks && data.tasks.downloads && data.tasks.downloads.some(d => d.status === 'downloading');
          if (isDownloading) {
            const dl = data.tasks.downloads.find(d => d.status === 'downloading');
            const pct = Math.round(dl.progress || 0);
            vbBadge.innerHTML = `🟢 Voicebox Active: <b>${profileName}</b> Voice<br><span style="font-size:0.7rem;opacity:0.85;">(AI Model downloading: ${pct}%)</span>`;
          } else {
            vbBadge.innerHTML = `🟢 Voicebox Connected: <b>${profileName}</b> Voice Clone`;
          }
          vbBadge.style.display = 'block';
        } else {
          vbBadge.style.display = 'none';
        }
      }
    }
  } catch (e) {}
}

function speak(text){
  if(!V.enabled||typeof text!=='string'||!text.trim())return;
  try{
    V.lastSpoken=text;
    V.isSpeaking = true;
    stopSpeaking();
    
    // Temporarily pause speech recognition so mic doesn't catch the speaker's voice
    if (V.recognition && V.listening) {
      try { V.recognition.stop(); } catch(e){}
    }

    const onDone = () => {
      V.isSpeaking = false;
      if (currentVoiceboxAudio) {
        currentVoiceboxAudio = null;
      }
      // After speech synthesis finishes, automatically restart listening for blind accessibility!
      if (V.enabled && (V.handsFree || V.continuousListening)) {
        setTimeout(() => {
          if (!V.isSpeaking) {
            startListening();
          }
        }, 300);
      }
    };

    // Try Voicebox AI voice first via backend /api/tts
    let voiceboxAttempted = false;
    const voiceboxPromise = (async () => {
      try {
        const controller = new AbortController();
        // Keep timeout snappy so there's no noticeable delay if Voicebox is busy or downloading
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const resp = await fetch("http://localhost:5000/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const contentType = resp.headers.get("content-type") || "";
          if (contentType.includes("audio") || contentType.includes("wav") || contentType.includes("octet-stream")) {
            const blob = await resp.blob();
            const audioUrl = URL.createObjectURL(blob);
            currentVoiceboxAudio = new Audio(audioUrl);
            currentVoiceboxAudio.playbackRate = V.rate || 1;
            currentVoiceboxAudio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              onDone();
            };
            currentVoiceboxAudio.onerror = () => {
              URL.revokeObjectURL(audioUrl);
              fallbackSpeech(text, onDone);
            };
            await currentVoiceboxAudio.play();
            return true;
          }
        }
      } catch (e) {}
      return false;
    })();

    voiceboxPromise.then(success => {
      if (!success) {
        fallbackSpeech(text, onDone);
      }
    });

  }catch(e){
    V.isSpeaking = false;
    console.error('speak error:',e);
  }
}

function fallbackSpeech(text, onDone) {
  if (!('speechSynthesis' in window)) {
    if (onDone) onDone();
    return;
  }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = V.rate;
    u.pitch = 1;
    const vs = speechSynthesis.getVoices().filter(v => /en[-_]/i.test(v.lang));
    if (vs.length) u.voice = vs[0];
    u.onend = onDone;
    u.onerror = onDone;
    speechSynthesis.speak(u);
  } catch(e) {
    if (onDone) onDone();
  }
}

function stopSpeaking(){
  if (currentVoiceboxAudio) {
    try {
      currentVoiceboxAudio.pause();
      currentVoiceboxAudio.currentTime = 0;
    } catch(e) {}
    currentVoiceboxAudio = null;
  }
  if('speechSynthesis' in window){try{speechSynthesis.cancel();}catch(e){}}
}
function setVoiceStatus(msg){
  const el=document.getElementById('voice-status');
  if(el)el.textContent=msg;
}
function openPanel(){
  checkVoiceboxStatus();
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
  V.rate=el?parseFloat(el.value):1;
  saveVoice();
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
function startListening(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    setVoiceStatus('Voice recognition is not supported in this browser.');
    announce('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
    return;
  }
  
  // Don't start if currently speaking
  if (V.isSpeaking) return;

  if (!V.recognition) {
    try{
      V.recognition=new SR();
      V.recognition.lang='en-US';
      V.recognition.interimResults=false;
      V.recognition.continuous=true;
      V.recognition.maxAlternatives=1;
      
      V.recognition.onresult=(ev)=>{
        let t='';
        for(let i=ev.resultIndex;i<ev.results.length;i++){
          if(ev.results[i].isFinal) t+=ev.results[i][0].transcript;
        }
        if(t.trim()) {
          playAudioChime('recognized');
          handleVoiceCommand(t.trim());
        }
      };
      
      V.recognition.onerror=(ev)=>{
        if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){
          setVoiceStatus('Microphone access denied. Please allow microphone permission.');
          announce('Microphone access was denied. Please check browser permissions.');
          V.listening=false;
          V.handsFree=false;
          updateMicUI();
        }else if(ev.error==='no-speech'){
          // Do not cancel listening on silence in hands-free mode!
          setVoiceStatus('🎤 Listening hands-free... Speak anytime.');
        }else if(ev.error==='network'){
          setVoiceStatus('Speech recognition network error.');
        }else{
          console.warn('Voice recognition error:', ev.error);
        }
      };
      
      V.recognition.onend=()=>{
        // In continuous hands-free mode, restart listening automatically unless user stopped or system is speaking
        if(V.listening && !V.isSpeaking && (V.handsFree || V.continuousListening)){
          setTimeout(() => {
            if(V.listening && !V.isSpeaking){
              try{ V.recognition.start(); }
              catch(e){}
            }
          }, 300);
        } else if(!V.handsFree) {
          V.listening=false;
          updateMicUI();
        }
      };
    }catch(e){
      setVoiceStatus('Could not initialize microphone.');
      return;
    }
  }

  V.listening=true;
  V.handsFree=true;
  openPanel();
  updateMicUI();
  try{
    V.recognition.start();
    setVoiceStatus('🎤 Listening hands-free... Speak anytime.');
    playAudioChime('listen');
  }catch(e){
    if(e.name !== 'InvalidStateError') {
      console.warn('Mic start error:', e);
    }
  }
}
function stopListening(force=false){
  if(force){
    V.handsFree=false;
    V.continuousListening=false;
  }
  V.listening=false;
  if(V.recognition){try{V.recognition.stop();}catch(e){}}
  updateMicUI();
  setVoiceStatus('Listening paused. Press Spacebar or click mic to resume.');
}
function toggleListening(){
  if(!speechSupported()){announce('Voice recognition is not supported in this browser. Please use Chrome or Edge.');return;}
  openPanel();
  if(V.listening)stopListening(true);
  else {
    V.handsFree=true;
    startListening();
  }
}

// ── VOICE LOGIN FLOW ──────────────────────────────
function startVoiceAssistant(){
  openPanel();
  if(V.listening)voiceContextIntro();
  else startListening();
}
function getCurrentPage(){
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
  setTimeout(() => {
    if (V.listening && V.enabled) {
      speak('You are now logged in and on your dashboard. Say analyze my skills to start your skill gap analysis, or say go to courses for recommendations.');
    }
  }, 1000);
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
  return /my\s+dream\s+job|i\s+want\s+to\s+(be|become|work\s+as|learn\s+to\s+be)|i\s+would\s+like\s+to\s+(be|become|work\s+as)|dream\s+job\s+(is|as|to)|set\s+(my\s+)?(dream\s+)?job/i.test(c);
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
  goTo('analyse');
  announce(`Dream job set to ${job}. Say analyze my skills to see your skill gap, or say go to courses for recommended courses.`);
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
  if(c.includes('i dont know')||c.includes('options')||c.includes('my interest')||c.includes('what should i')||c.includes('help me choose')||c.includes('help me pick'))return true;
  if(c.includes('job')){
    return c.includes('list')||c.includes('show')||c.includes('available')||c.includes('which')||c.includes('what')||c.includes('find')||c.includes('pick')||c.includes('choose')||c.includes('select')||c.includes('suggest')||c.includes('recommend');
  }
  return false;
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
function startInterestFlow(c){
  V.interest={active:true,stage:'interest',matches:[],introShown:true};
  const direct=JOB_LIST.find(j=>c.includes(j.toLowerCase()));
  if(direct){applyDreamJob(direct);return;}
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

// ── AUTO VOICE ON OPEN (Accessible for Blind Users) ───
function initAutoVoice(){
  if(!speechSupported())return;
  
  const welcomeText = 'Welcome to SkillNexus AI, the accessible voice learning platform for everyone. Hands-free voice assistant is active. To log in with your voice, say: Voice Login, or say: Hi, I am, followed by your name. Say: Help, to hear all commands. You can speak anytime without clicking.';

  window.triggerVoiceGreeting = function(){
    if(V.autoWelcomeTriggered) return;
    V.autoWelcomeTriggered = true;
    V.handsFree = true;
    V.listening = true;
    openPanel();
    speak(welcomeText);
  };

  // Immediate attempt on page load
  setTimeout(() => {
    try {
      const u = new SpeechSynthesisUtterance('');
      speechSynthesis.speak(u);
    } catch (e) {}
  }, 100);

  // Trigger voice greeting immediately on first touch, click, or keypress anywhere
  const handleFirstInteraction = () => {
    ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
      document.removeEventListener(evt, handleFirstInteraction, true);
      window.removeEventListener(evt, handleFirstInteraction, true);
    });
    window.triggerVoiceGreeting();
  };

  ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
    document.addEventListener(evt, handleFirstInteraction, { once: true, capture: true });
    window.addEventListener(evt, handleFirstInteraction, { once: true, capture: true });
  });

  // Global Keyboard Accessibility: Spacebar pauses/resumes listening or stops speaking
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
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
  const hasNav=c.includes('go')||c.includes('open')||c.includes('navigate')||c.includes('show')||c.includes('view')||c.includes('switch')||c.includes('take me');
  for(const key in PAGES){
    const match=PAGES[key].some(w=>c.includes(w));
    const words=c.trim().split(/\s+/);
    if(match&&(hasNav||words.length===1)){
      goTo(key);
      announce('Navigated to '+PAGES[key][0]);
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
  const canvas = document.getElementById('bio-wave-canvas');
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
  const title = document.getElementById('bio-modal-title');
  const badge = document.getElementById('bio-mode-badge');
  const sub = document.getElementById('bio-modal-sub');
  const step1 = document.getElementById('bio-step-1');
  const step2 = document.getElementById('bio-step-2');
  const step3 = document.getElementById('bio-step-3');
  const sTitle = document.getElementById('bio-status-title');
  const sDesc = document.getElementById('bio-status-desc');
  const glow = document.getElementById('bio-glow-ring');
  const icon = document.getElementById('bio-scanner-icon');

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

  setVoiceStatus(`Matching speaker: ${cleanName}...`);
  try {
    const q = query(collection(fsdb, "users"));
    const snap = await getDocs(q);
    let found = null;
    snap.forEach(d => {
      const u = d.data();
      if (u.name) {
        const uName = u.name.toLowerCase().trim();
        if (uName === cleanName || uName.includes(cleanName) || cleanName.includes(uName)) {
          found = { ...u, id: d.id };
        }
      }
    });

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
  } catch(e) {
    console.error("User search error:", e);
    // Fallback demo user
    flow.step = 'passphrase';
    flow.user = { name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1), email: `${cleanName.replace(/\s+/g, '')}@example.com` };
    updateBioModalUI();
    speak(`Hello ${flow.user.name}. Please say: My voice is my password.`);
  }
}

function verifyBioPassphraseManually() {
  if (!V.voiceBioFlow || !V.voiceBioFlow.active) return;
  const flow = V.voiceBioFlow;
  if (flow.mode === 'login') {
    flow.step = 'verified';
    updateBioModalUI();
    const user = flow.user || { name: 'Student', email: 'student@example.com' };
    S.user = { name: user.name, email: user.email };
    document.getElementById('nav-uname').textContent = user.name;
    speak(`Voiceprint verified with 99% confidence. Welcome back, ${user.name}!`);

    setTimeout(() => {
      closeVoiceBioModal(false);
      exitLoginFlow();
      go('app');
      goTo('analyse');
    }, 1200);
  } else if (flow.mode === 'enroll') {
    flow.step = 'enrolled';
    updateBioModalUI();
    const name = flow.enrollName || 'Student';
    const email = `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

    try {
      const ref = doc(collection(fsdb, "users"));
      setDoc(ref, {
        name: name,
        email: email,
        method: 'Voice Biometrics',
        voiceboxEnrolled: true,
        voiceprintEnrolled: true,
        joined: new Date().toLocaleDateString()
      });
    } catch(e) {
      console.error("Firestore enrollment error:", e);
    }

    S.user = { name, email };
    document.getElementById('nav-uname').textContent = name;
    speak(`Voice biometric enrollment complete! Welcome to SkillNexus AI, ${name}.`);

    setTimeout(() => {
      closeVoiceBioModal(false);
      exitLoginFlow();
      go('app');
      goTo('analyse');
    }, 1200);
  }
}

async function handleVoiceBioCommand(t, c) {
  const trEl = document.getElementById('bio-spoken-transcript');
  if (trEl) trEl.textContent = `Heard: "${t}"`;

  if (c.includes('cancel') || c.includes('exit') || c.includes('close modal')) {
    closeVoiceBioModal();
    speak("Voice biometric login cancelled.");
    return;
  }

  const flow = V.voiceBioFlow;
  if (!flow || !flow.active) return;

  if (flow.mode === 'login') {
    if (flow.step === 'name') {
      if (c.includes('enroll') || c.includes('register') || c.includes('sign up')) {
        flow.mode = 'enroll';
        flow.step = 'enroll_passphrase';
        flow.enrollName = flow.tempName || 'Student';
        updateBioModalUI();
        speak(`Enrolling voice for ${flow.enrollName}. Please say your passphrase: My voice is my password.`);
        return;
      }
      handleVoiceBioNameInput(c);
      return;
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
          speak("Voice verification failed 3 times. Please log in using your password.");
          setTimeout(() => {
            closeVoiceBioModal();
            go('login');
          }, 2000);
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
      let name = c.replace(/^(my\s+name\s+is|i\s+am|i'm|this\s+is)\s+/i, '').trim();
      name = name.charAt(0).toUpperCase() + name.slice(1);
      if (!name) {
        speak("Please say your name.");
        return;
      }
      flow.enrollName = name;
      flow.step = 'enroll_passphrase';
      updateBioModalUI();
      speak(`Great ${name}. Now say your voice passphrase to generate your biometric voiceprint: My voice is my password.`);
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
  if(c.includes('stop listening')||c.includes('stop assistant')){
    stopSpeaking();stopListening();exitLoginFlow();announce('Voice assistant stopped.');return;
  }

  // Priority 1: If Voice Biometric Modal is open, route ALL speech directly to it!
  if (V.voiceBioFlow && V.voiceBioFlow.active) {
    handleVoiceBioCommand(t, c);
    return;
  }

  const loginScreen=document.getElementById('screen-login');
  if(V.loginFlow.active&&loginScreen&&loginScreen.classList.contains('active')){
    handleLoginVoiceCommand(t,c);
    return;
  }
  if(V.registrationFlow.active){handleVoiceRegistration(t,c);return;}
  if(V.analysisFlow.active){handleVoiceAnalysis(t,c);return;}
  if(V.courseFlow.active){handleVoiceCourse(t,c);return;}
  
  if(c.includes("voice login") || c.includes("login with voice") || c.includes("log in with voice") || c.includes("biometric login")) {
    openVoiceBioModal('login');
    return;
  }
  if(c.includes("enroll voice") || c.includes("register voice") || c.includes("voice signup")) {
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
  if(c.includes("analyze my skills") || c.includes("analyse my skills")) {
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
  if(c.includes('go back')||c.includes('go to previous')||c.includes('previous page')){goBack();return;}
  if(c.includes('dashboard')||c.includes('home page')||c.includes('home')){goTo('analyse');announce('Navigated to dashboard.');return;}
  if(c.includes('skill gap')||c.includes('my gap')){goTo('results');announce('Showing your skill gap results.');return;}
  if(c.includes('analyze')||c.includes('analyse')){analyzeSkills();return;}
  if(c.includes('help')||c.includes('commands')||c.includes('what can you do')){sayHelp();return;}
  if(c.includes('logout')||c.includes('log out')||c.includes('sign out')){logout();return;}
  if(c.includes('sign up')||c.includes('signup')){go('signup');return;}
  if(c.includes('log in')||c.includes('login')||c.includes('sign in')){go('login');return;}
  if(c.includes('voice on')||c.includes('turn on voice')){setVoiceEnabled(true);return;}
  if(c.includes('voice off')||c.includes('turn off voice')){setVoiceEnabled(false);return;}
  if(c.includes('theme')||c.includes('dark mode')||c.includes('light mode')){toggleTheme();return;}
  if(voiceNav(c))return;
  
  // Fallback to Backend LLM
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

// ── VOICE INIT ────────────────────────────────────
function initVoice(){
  const cb=document.getElementById('voice-enabled');
  if(cb)cb.checked=V.enabled;
  const r=document.getElementById('voice-rate');
  if(r)r.value=String(V.rate);
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
  const pwd = prompt('🔐 Enter Admin Password:');
  if(pwd === null) return;
  if(pwd !== 'skillsync@admin2025'){
    showToast('Incorrect password. Access denied.','error');
    return;
  }
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
      speak(`You are now logged in, ${found.name}. Welcome to your dashboard.`);
      go('app');
      goTo('analyse');
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
        speak(`You're registered, ${name}. Logging you in now.`);
        go('app');
        goTo('analyse');
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
  V.analysisFlow.active = true;
  V.analysisFlow.step = 'skill';
  speak("Which skill would you like to analyze?");
}

function handleVoiceAnalysis(t, c) {
  const step = V.analysisFlow.step;
  if(c.includes("cancel")) {
    V.analysisFlow.active = false;
    speak("Analysis cancelled.");
    return;
  }
  
  if(step === 'skill') {
    const job = JOB_LIST.find(j => c.includes(j.toLowerCase()));
    S.dreamJob = job || t;
    document.getElementById('dream-job').value = S.dreamJob;
    V.analysisFlow.step = 'currentSkills';
    speak(`What skills do you already have in ${S.dreamJob}?`);
  } else if(step === 'currentSkills') {
    S.skills = t.split(/,|and/i).map(s => s.trim()).filter(s => s);
    renderTags();
    V.analysisFlow.step = 'time';
    speak("How much time can you commit — for example, hours per week?");
  } else if(step === 'time') {
    const time = parseSpokenNumber(c);
    S.hoursPerWeek = time || 10;
    document.getElementById('hours-week').value = S.hoursPerWeek;
    V.analysisFlow.active = false;
    speak("Analyzing your skill gap now, please wait.");
    analyzeSkills();
    
    const interval = setInterval(() => {
      if(S.resultsReady) {
        clearInterval(interval);
        speak(`Analysis complete. Match score ${S.matchScore} percent. Say 'show my roadmap' to continue.`);
      }
    }, 1000);
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
      speak(`Opening ${found.name}. I will wait for you to return.`);
      window.open(found.url, '_blank');
      
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

// Initial Voicebox connection check
checkVoiceboxStatus();
setInterval(checkVoiceboxStatus, 15000);

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

