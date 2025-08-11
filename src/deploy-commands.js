// src/deploy-commands.js
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import squigNews from './slash/squignews.js';

const TOKEN  = process.env.DISCORD_TOKEN;
const APP_ID = process.env.DISCORD_APP_ID;
if (!TOKEN) throw new Error('DISCORD_TOKEN required');
if (!APP_ID) throw new Error('DISCORD_APP_ID required');

const rest = new REST({ version: '10' }).setToken(TOKEN);
const commands = [squigNews.data.toJSON()];

// Support either GUILD_IDS (multi) or GUILD_ID (single) or GLOBAL
const guildIds = (process.env.GUILD_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const singleGuildId = (process.env.GUILD_ID || '').trim();

(async () => {
  try {
    if (guildIds.length) {
      for (const gid of guildIds) {
        console.log('Registering guild commands →', gid);
        const res = await rest.put(
          Routes.applicationGuildCommands(APP_ID, gid),
          { body: commands }
        );
        console.log('✅ Registered:', res.map(c => c.name).join(', '), 'in', gid);
      }
    } else if (singleGuildId) {
      console.log('Registering guild commands →', singleGuildId);
      const res = await rest.put(
        Routes.applicationGuildCommands(APP_ID, singleGuildId),
        { body: commands }
      );
      console.log('✅ Registered:', res.map(c => c.name).join(', '), 'in', singleGuildId);
    } else {
      console.log('Registering GLOBAL commands (can take up to ~1 hour)…');
      const res = await rest.put(
        Routes.applicationCommands(APP_ID),
        { body: commands }
      );
      console.log('✅ Registered global:', res.map(c => c.name).join(', '));
    }
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
    process.exit(1);
  }
})();
