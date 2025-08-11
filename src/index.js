import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, InteractionType, EmbedBuilder, ChannelType } from 'discord.js';
import squigNews from './slash/squignews.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

// Session store for ephemeral builders
const sessions = new Map(); // key: userId, value: { items: [], channelId: null, color: number }

export function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, { items: [], channelId: null, color: parseInt(process.env.BRAND_COLOR || '7F00FF', 16) });
  }
  return sessions.get(userId);
}

export function clearSession(userId) {
  sessions.delete(userId);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === squigNews.data.name) {
        return squigNews.execute(interaction, client);
      }
    }
// AFTER
const isSelect =
  interaction.isStringSelectMenu?.() ||
  interaction.isChannelSelectMenu?.() ||
  interaction.isRoleSelectMenu?.() ||
  interaction.isUserSelectMenu?.();

if (interaction.isButton() || isSelect || interaction.type === InteractionType.ModalSubmit) {
  // For Channel Select Menu, the customId is on the component, so still fine:
  if (interaction.customId?.startsWith('snews:')) {
    return squigNews.route(interaction, client);
  }
}

    // Delegate component and modal handlers to the command module
    if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId?.startsWith('snews:')) {
        return squigNews.route(interaction, client);
      }
    }
  } catch (err) {
    console.error(err);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: 'Uh oh. The Squig dropped the news parchment. Try again?', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Uh oh. The Squig dropped the news parchment. Try again?', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
