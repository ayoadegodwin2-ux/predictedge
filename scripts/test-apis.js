// scripts/test-apis.js
// Run with: node --env-file=.env.local scripts/test-apis.js

async function testAPIs() {
    console.log('🧪 Starting Multi-Provider API Verification Test...\n');

    // 1. Test Football-Data.org (European Provider)
    try {
        console.log('Checking Football-Data.org...');
        const res = await fetch('https://api.football-data.org/v4/competitions', {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY }
        });
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ Football-Data.org: SUCCESS (Retrieved ${data.count || 'multiple'} competitions)`);
        } else {
            console.log(`❌ Football-Data.org: FAILED Status ${res.status} - ${res.statusText}`);
        }
    } catch (err) {
        console.log(`❌ Football-Data.org: ERROR -> ${err.message}`);
    }

    // 2. Test API-Ninjas (Global Provider)
    try {
        console.log('\nChecking API-Ninjas...');
        const res = await fetch('https://api.api-ninjas.com/v1/soccermatches?league=mls', {
            headers: { 'X-Api-Key': process.env.API_NINJAS_KEY }
        });
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ API-Ninjas: SUCCESS (Global match endpoint responded)`);
        } else {
            console.log(`❌ API-Ninjas: FAILED Status ${res.status} - ${res.statusText}`);
        }
    } catch (err) {
        console.log(`❌ API-Ninjas: ERROR -> ${err.message}`);
    }

    // 3. Test The Odds API (Market Data)
    try {
        console.log('\nChecking The Odds API...');
        const res = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${process.env.ODDS_API_KEY}`);
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ The Odds API: SUCCESS (Retrieved ${data.length} sports categories)`);
        } else {
            console.log(`❌ The Odds API: FAILED Status ${res.status} - ${res.statusText}`);
        }
    } catch (err) {
        console.log(`❌ The Odds API: ERROR -> ${err.message}`);
    }

    console.log('\n🏁 Verification Test Complete.');
}

testAPIs();