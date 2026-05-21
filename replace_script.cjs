const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('find src -type f -name "*.tsx"').toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  // bg colors
  content = content.replace(/bg-\[\#09090b\]((?:\/[0-9]+)?)/g, 'bg-white dark:bg-[#09090b]$1');
  content = content.replace(/bg-\[\#121214\]((?:\/[0-9]+)?)/g, 'bg-zinc-50 dark:bg-[#121214]$1');
  content = content.replace(/bg-\[\#18181b\]((?:\/[0-9]+)?)/g, 'bg-white dark:bg-[#18181b]$1');
  content = content.replace(/bg-\[\#0f0f11\]((?:\/[0-9]+)?)/g, 'bg-zinc-50 dark:bg-[#0f0f11]$1');
  content = content.replace(/bg-\[\#1a1a1c\]((?:\/[0-9]+)?)/g, 'bg-zinc-100 dark:bg-[#1a1a1c]$1');
  content = content.replace(/bg-\[\#1e1e20\]((?:\/[0-9]+)?)/g, 'bg-white dark:bg-[#1e1e20]$1');

  // bg-zinc colors
  content = content.replace(/bg-zinc-900/g, 'bg-zinc-100 dark:bg-zinc-900');
  content = content.replace(/bg-zinc-800/g, 'bg-zinc-200 dark:bg-zinc-800');
  content = content.replace(/bg-zinc-700/g, 'bg-zinc-300 dark:bg-zinc-700');
  content = content.replace(/hover:bg-zinc-800/g, 'hover:bg-zinc-200 dark:hover:bg-zinc-800');
  content = content.replace(/hover:bg-zinc-700/g, 'hover:bg-zinc-300 dark:hover:bg-zinc-700');
  content = content.replace(/hover:bg-zinc-900/g, 'hover:bg-zinc-100 dark:hover:bg-zinc-900');

  // border colors
  content = content.replace(/border-\[\#27272a\]/g, 'border-zinc-200 dark:border-[#27272a]');
  content = content.replace(/border-zinc-800((?:\/[0-9]+)?)/g, 'border-zinc-300 dark:border-zinc-800$1');
  content = content.replace(/border-zinc-700((?:\/[0-9]+)?)/g, 'border-zinc-300 dark:border-zinc-700$1');
  content = content.replace(/focus:border-zinc-700/g, 'focus:border-zinc-300 dark:focus:border-zinc-700');
  // ring colors
  content = content.replace(/ring-offset-\[\#09090b\]/g, 'ring-offset-white dark:ring-offset-[#09090b]');

  // text colors
  content = content.replace(/text-\[\#e4e4e7\]/g, 'text-zinc-900 dark:text-[#e4e4e7]');
  content = content.replace(/text-zinc-400/g, 'text-zinc-600 dark:text-zinc-400');
  content = content.replace(/text-zinc-300/g, 'text-zinc-700 dark:text-zinc-300');
  content = content.replace(/text-zinc-200/g, 'text-zinc-800 dark:text-zinc-200');
  content = content.replace(/text-zinc-100/g, 'text-zinc-900 dark:text-zinc-100');
  content = content.replace(/hover:text-zinc-200/g, 'hover:text-zinc-800 dark:hover:text-zinc-200');
  content = content.replace(/hover:text-zinc-100/g, 'hover:text-zinc-900 dark:hover:text-zinc-100');
  content = content.replace(/hover:text-white/g, 'hover:text-black dark:hover:text-white');
  
  content = content.replace(/prose-invert/g, 'dark:prose-invert');

  fs.writeFileSync(file, content);
});
console.log('done');
