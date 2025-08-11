import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import squigNews from './slash/squignews.js';

const commands = [squigNews.data.toJSON()];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function main() {
  const appId = process.env.DISCORD_APP_ID;
  const guildId = process.env.GUILD_ID; // for quick iteration

  if (!appId) throw new Error('DISCORD_APP_ID is required');

  if (guildId) {
    console.log('Registering guild commands...');
    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands });
    console.log('✅ Guild commands registered');
  } else {
    console.log('Registering global commands... (takes up to 1 hour)');
    await rest.put(Routes.applicationCommands(appId), { body: commands });
    console.log('✅ Global commands registered');
  }
}

main().catch(console.error);
