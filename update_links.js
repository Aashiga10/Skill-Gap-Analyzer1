import fs from 'fs';

async function getYouTubeVideoId(query) {
    try {
        const ytRes = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
        const ytHtml = await ytRes.text();
        const ytMatch = ytHtml.match(/"videoId":"([^"]{11})"/);
        if (ytMatch) return ytMatch[1];
        
        return null;
    } catch(e) {
        return null;
    }
}

async function run() {
    let appJs = fs.readFileSync('frontend/app.js', 'utf8');
    
    // Find all urls
    const regex = /url:"https:\/\/www\.youtube\.com\/results\?search_query=([^"]+)"/g;
    let match;
    let replacements = [];
    
    console.log("Searching for direct links...");
    
    while ((match = regex.exec(appJs)) !== null) {
        let query = match[1].replace(/\+/g, ' ');
        let id = await getYouTubeVideoId(query);
        
        if (id) {
            console.log(`[+] Found ${id} for query: ${query}`);
            replacements.push({
                original: match[0],
                newUrl: `url:"https://www.youtube.com/watch?v=${id}"`
            });
        } else {
            console.log(`[-] Could not find direct link for query: ${query}`);
        }
        
        // delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
    }
    
    console.log("Replacing links in app.js...");
    for (let r of replacements) {
        appJs = appJs.replace(r.original, r.newUrl);
    }
    
    fs.writeFileSync('frontend/app.js', appJs);
    console.log(`Done! Replaced ${replacements.length} links.`);
}

run();
