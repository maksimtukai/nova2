const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env','utf8').split('\n').forEach(l=>{const[k,...v]=l.split('=');if(k&&v.length)process.env[k.trim()]=v.join('=').trim();});

const AUTH_EMAIL_ALIASES = {
  'maksimtuka@gmail.com': ['maksimtukai@gmail.com'],
  'maksimtukai@gmail.com': ['maksimtuka@gmail.com'],
};

function getAuthEmailCandidates(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const aliases = AUTH_EMAIL_ALIASES[normalized] || [];
  return [...new Set([normalized, ...aliases])];
}

(async () => {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  for (const candidate of getAuthEmailCandidates('maksimtuka@gmail.com')) {
    const { data } = await sb.from('users').select('email,name').eq('email', candidate).maybeSingle();
    console.log(candidate, data);
  }
})();
