import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import squigNews from './slash/squignews.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const appId = process.env.DISCORD_APP_ID;
if (!appId) throw new Error('DISCORD_APP_ID required');

const commands = [squigNews.data.toJSON()];

// Support either GUILD_IDS (multi) or GUILD_ID (single) or global
const multi = (process.env.GUILD_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const single = process.env.GUILD_ID?.trim();

(async () => {
  if (multi.length) {
    for (const gid of multi) {
      console.log('Registering guild commands →', gid);
      const res = await rest.put(Routes.applicationGuildCommands(appId, gid), { body: commands });
      console.log('✅ Registered:', res.map(c => c.name).join(', '), 'in', gid);
    }
  } else if (single) {
    console.log('Registering guild commands →', single);
    const res = await rest.put(Routes.applicationGuildCommands(appId, single), { body: commands });
    console.log('✅ Registered:', res.map(c => c.name).join(', '), 'in', single);
  } else {
    console.log('Registering GLOBAL commands (can take up to ~1 hour)…');
    const res = await rest.put(Routes.applicationCommands(appId), { body: commands });
    console.log('✅ Registered global:', res.map(c => c.name).join(', '));
  }
})();
