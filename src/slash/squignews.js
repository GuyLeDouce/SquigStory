import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder
} from 'discord.js';
import { getSession, clearSession } from '../index.js';

const MAX_ITEMS = 5;

export default {
  data: new SlashCommandBuilder()
    .setName('squignews')
    .setDescription('Open the Squigs News Broadcaster builder (admin only).')
    .setDMPermission(false),

  async execute(interaction, client) {
    if (!await isAllowed(interaction)) {
      return interaction.reply({ content: 'Only trusted Squigs may broadcast. (Admins only)', ephemeral: true });
    }

    const session = getSession(interaction.user.id);
    session.items = []; session.channelId = null; // reset

    return interaction.reply({
      ephemeral: true,
      content: '🎙️ **Squigs News Broadcaster** — build a crypto news dispatch for the humans to ponder.',
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('snews:add').setLabel('➕ Add news item').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('snews:color').setLabel('🎨 Theme color').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('snews:reset').setLabel('🗑️ Reset').setStyle(ButtonStyle.Secondary)
        ),
        new ActionRowBuilder().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('snews:channel')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setPlaceholder('Select a target channel…')
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('snews:preview').setLabel('👀 Preview').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('snews:publish').setLabel('🚀 Publish').setStyle(ButtonStyle.Success).setDisabled(true),
          new ButtonBuilder().setCustomId('snews:cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
        )
      ]
    });
  },

  async route(interaction, client) {
    const [ns, action] = interaction.customId.split(':');
    const session = getSession(interaction.user.id);

    if (!(await isAllowed(interaction))) {
      return interaction.reply({ content: 'Admins only.', ephemeral: true });
    }

    switch (action) {
      case 'add':
        return openItemModal(interaction);
      case 'add_submit':
        return onItemSubmit(interaction, session);
      case 'channel':
        session.channelId = interaction.values?.[0] || null;
        return interaction.reply({ ephemeral: true, content: `Target channel set: <#${session.channelId}>` });
      case 'color':
        return openColorMenu(interaction, session);
      case 'color_set':
        session.color = parseInt(interaction.values?.[0] ?? '7F00FF', 16);
        return interaction.reply({ ephemeral: true, content: `Theme color set to #${session.color.toString(16).toUpperCase()}` });
      case 'reset':
        session.items = []; session.channelId = null;
        return interaction.reply({ ephemeral: true, content: 'Builder reset. Start fresh.' });
      case 'preview':
        return showPreview(interaction, session);
      case 'publish':
        return publish(interaction, session, client);
      case 'cancel':
        clearSession(interaction.user.id);
        return interaction.reply({ ephemeral: true, content: 'Broadcast canceled.' });
      default:
        // modal submits arrive with .customId; handled above
        return;
    }
  }
};

async function isAllowed(interaction) {
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const hasAdminPerm = member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild);

  const roleId = process.env.ADMIN_ROLE_ID;
  const allowUsers = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const hasRole = roleId ? member.roles.cache.has(roleId) : false;
  const isAllowUser = allowUsers.includes(interaction.user.id);

  return hasAdminPerm || hasRole || isAllowUser;
}

function openItemModal(interaction) {
  const modal = new ModalBuilder().setCustomId('snews:add_submit').setTitle('Add News Item');
  const headline = new TextInputBuilder().setCustomId('headline').setLabel('Headline').setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(true);
  const summary = new TextInputBuilder().setCustomId('summary').setLabel('Summary (1-2 sentences)').setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true);
  const url = new TextInputBuilder().setCustomId('url').setLabel('Article URL').setStyle(TextInputStyle.Short).setRequired(true);
  const source = new TextInputBuilder().setCustomId('source').setLabel('Source (e.g., CoinDesk)').setStyle(TextInputStyle.Short).setRequired(false);
  const image = new TextInputBuilder().setCustomId('image').setLabel('Image URL (optional)').setStyle(TextInputStyle.Short).setRequired(false);

  return interaction.showModal(modal.addComponents(
    new ActionRowBuilder().addComponents(headline),
    new ActionRowBuilder().addComponents(summary),
    new ActionRowBuilder().addComponents(url),
    new ActionRowBuilder().addComponents(source),
    new ActionRowBuilder().addComponents(image)
  ));
}

async function onItemSubmit(interaction, session) {
  await interaction.deferReply({ ephemeral: true });

  if (session.items.length >= MAX_ITEMS) {
    return interaction.editReply('You already added the maximum number of items.');
  }

  const headline = interaction.fields.getTextInputValue('headline');
  const summary = interaction.fields.getTextInputValue('summary');
  const url = interaction.fields.getTextInputValue('url');
  const source = interaction.fields.getTextInputValue('source') || '';
  const image = interaction.fields.getTextInputValue('image') || '';

  session.items.push({ headline, summary, url, source, image });

  return interaction.editReply(`Added **${headline}**. (${session.items.length}/${MAX_ITEMS})`);
}

function openColorMenu(interaction, session) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('snews:color_set')
    .setPlaceholder('Pick a theme color')
    .addOptions(
      { label: 'Ugly Purple', value: '7F00FF' },
      { label: 'Neon Green', value: '39FF14' },
      { label: 'Toxic Yellow', value: 'F2FF00' },
      { label: 'Infrared', value: 'FF0050' },
      { label: 'Void Black', value: '000000' }
    );

  return interaction.reply({ ephemeral: true, components: [ new ActionRowBuilder().addComponents(select) ] });
}

function buildEmbeds(session, author) {
  const color = session.color ?? parseInt(process.env.BRAND_COLOR || '7F00FF', 16);

  const header = new EmbedBuilder()
    .setTitle('🗞️ Squigs Crypto Dispatch')
    .setDescription('Humans continue to do remarkably Ugly things. We took notes:')
    .setColor(color)
    .setFooter({ 
      text: `Filed on ${new Date().toLocaleDateString()} \nFiled by Blinky von Scoop`
    })
    .setTimestamp(new Date());

const items = session.items.map((it) => {
  const e = new EmbedBuilder()
    .setTitle(it.headline)
    .setDescription(it.summary)
    .setURL(it.url)
    .setColor(color);

    if (it.source) e.addFields({ name: 'Source', value: it.source, inline: true });
    if (it.image) e.setImage(it.image);
    return e;
  });

  return [header, ...items];
}


async function showPreview(interaction, session) {
  if (session.items.length === 0) {
    return interaction.reply({ ephemeral: true, content: 'Add at least one news item first.' });
  }

  const channelSet = Boolean(session.channelId);
  const embeds = buildEmbeds(session, interaction.member.user);

  return interaction.reply({
    ephemeral: true,
    content:
      `Preview ${channelSet ? `→ will post to <#${session.channelId}>` : '(no channel selected yet)'}\n` +
      `Items: ${session.items.length}/${MAX_ITEMS}`,
    embeds,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('snews:add').setLabel('➕ Add item').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('snews:edit').setLabel('✏️ Edit item').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('snews:preview').setLabel('🔄 Refresh preview').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('snews:publish').setLabel('🚀 Publish').setStyle(ButtonStyle.Success).setDisabled(!channelSet)
      )
    ]
  });
}

async function publish(interaction, session, client) {
  if (!session.channelId) {
    return interaction.reply({ ephemeral: true, content: 'Pick a target channel first.' });
  }
  if (session.items.length === 0) {
    return interaction.reply({ ephemeral: true, content: 'Add at least one news item.' });
  }

  const channel = await client.channels.fetch(session.channelId);
  if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
    return interaction.reply({ ephemeral: true, content: 'Invalid target channel.' });
  }

  const embeds = buildEmbeds(session, interaction.member.user);
  await channel.send({ embeds });

  clearSession(interaction.user.id);
  return interaction.reply({ ephemeral: true, content: `Posted ${embeds.length - 1} item(s) to ${channel}.` });
}
