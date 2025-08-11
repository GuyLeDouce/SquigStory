# Squigs News Broadcaster Bot

A single-command, admin-only Discord bot that opens an embed builder to publish Squigs-flavored crypto news to a chosen channel.

## Quick Start
1. **Create bot** in the Discord Developer Portal, invite with `applications.commands` and `bot` scopes. Privileged intents not required.
2. `cp .env.example .env` and fill values.
3. `npm i`
4. Register commands (guild for fast testing): `npm run register`
5. Run the bot: `npm start`

## Usage
- Use `/squignews` in a server where the bot is present.
- Only users with **Admin** or **Manage Server** perms, the `ADMIN_ROLE_ID` role, or listed in `ADMIN_USER_IDS` can run it.
- Add up to 5 items. Choose a channel. Preview. Publish.

## Deploy on Railway
1. Create a new **Railway** project → **Deploy from GitHub** (connect this repo).
2. Add **Environment Variables** in Railway:
   - `DISCORD_TOKEN`
   - `DISCORD_APP_ID`
   - *(optional)* `GUILD_ID` (only for dev registration; remove or leave blank for global)
   - *(optional)* `ADMIN_ROLE_ID`, `ADMIN_USER_IDS`, `BRAND_COLOR`
3. Set **Start Command**: `node src/index.js`
4. After first deploy, run the **register** script locally _or_ create a second Railway service/Job to run `node src/deploy-commands.js` one time.

## Customize
- Change command name by editing `setName('squignews')`.
- Edit color presets in `openColorMenu`.
- Tweak the header embed text in `buildEmbeds`.

## Notes
- The builder is entirely **ephemeral** and stateful per user during the session.
- Modals are used for clean, multiline input.
- Announcements channels are supported.
