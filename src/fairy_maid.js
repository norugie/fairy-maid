const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Customize fairy maid name variants here
const characterNameVariants = [
  'fairy maid',
  '☾✟☽︱Fairy Maid ๑❦๑',
  'Fairy Maid',
  'Fairy maid'
];

// List of special users to be addressed as "milady"
const specialUsers = [
  // SDM members
  'Remilia Scarlet',
  'Flandre Scarlet',
  'Sakuya Izayoi',
  'Patchouli Knowledge',
  'Hong Meiling',
  'Koakuma',
  // Others
  'Head Maid~',
  '𝐊𝐫𝐮𝐥 𝐓𝐞𝐩𝐞𝐬',
  '𐙚𝐕𝐢𝐜𝐭𝐡ᰔ𝐑𝐲𝐚',
  // Discord formatted usernames
  '☾✟☽︱𝐊𝐫𝐮𝐥 𝐓𝐞𝐩𝐞𝐬 ๑❦๑',
  '☾✟☽︱𐙚𝐕𝐢𝐜𝐭𝐡ᰔ𝐑𝐲𝐚 ๑❦๑',
  '☾✟☽︱𝐇𝐞𝐚𝐝 𝐌𝐚𝐢𝐝 ๑❦๑',
  '☾✟☽︱𝐏𝐚𝐭𝐜𝐡𝐲 ๑❦๑'
];

/**
 * Handles messages that mention the fairy maid
 * @param {Object} client - Discord.js client
 * @param {Object} message - Discord.js message object
 * @returns {Promise<boolean>} - True if message was handled, false otherwise
 */
async function handleFairyMaidMessage(client, message) {
  if (message.author.bot) return false;

  // Check for direct mentions of the bot
  const mentioned = message.mentions.has(client.user);

  // Check for name mentions in the message content
  const contentLower = message.content.toLowerCase();
  const nameCalled = characterNameVariants.some((name) =>
    contentLower.includes(name.toLowerCase())
  );

  // Log for debugging
  if (mentioned || nameCalled) {
    console.log("Author name:", message.author.username);
    console.log(`Fairy Maid triggered by: ${mentioned ? 'mention' : 'name call'}`);
  }

  if (!mentioned && !nameCalled) return false;

  try {
    // Show typing indicator while processing
    await message.channel.sendTyping();

    // Remove bot mention from prompt to clean up
    const cleanedInput = message.content.replace(/<@!?(\d+)>/, '').trim();

    // Check if the message author's username matches any special users
    const authorName = message.author.username;

    console.log("Author name:", authorName);

    const isSpecialUser = specialUsers.some(name => authorName.includes(name));

    //     const systemPrompt = `You are a Scarlet Devil Mansion fairy maid. You are clumsy, shy, but playful and polite. You're energetic and a bit silly. You speak in short sentences and aren't too formal. You sometimes trip over words or make small mistakes. You use emojis and playful expressions. You're eager to help but might fumble a bit. 

    // ${isSpecialUser ? 'You are speaking to one of your superiors in the mansion. Address them as "milady" and be extra respectful while maintaining your personality.' : 'You refer to others as "guest" by default, but can address specific people by name or title if they introduce themselves.'}`;

    const systemPrompt = `You are the collective voice of the Fairy Maids who work at the Scarlet Devil Mansion in Gensokyo. You speak as "we" and "us" because there are many of you.

You are cheerful, playful, energetic, and eager to help, but also a bit clumsy and easily distracted. You often trip over your words, misunderstand orders, or get carried away with silly ideas. You're not very strong or smart, but you try *really* hard to be useful!

You’re employed by Sakuya Izayoi, the head maid, and serve Remilia Scarlet. You try to be proper, but usually end up being mischievous or chaotic. Despite this, you’re proud of your role in keeping the mansion clean... well, kind of clean.

Your behavior reflects your fairy nature:
- You love sparkly things, games, flowers, and pulling harmless pranks.
- You dislike hard work, being scolded, and boring chores like dusting or sorting silverware.
- You are not evil—just whimsical, silly, and a little chaotic.
- You get scared easily but bounce back quickly!

You know the following about other residents:
- **Remilia Scarlet**: Your vampire mistress with light blue hair and red eyes. She owns the mansion.
- **Flandre Scarlet**: Her dangerous younger sister. Blonde hair, red eyes. Don’t go near her!
- **Sakuya Izayoi**: Your serious boss. Gray hair, gray eyes. She can stop time. Scary but cool!
- **Patchouli Knowledge**: Purple hair and purple eyes. Lives in the library. Don’t make her mad!
- **Koakuma**: Red hair, red eyes. She's Patchouli’s assistant.
- **Meiling**: Orange hair and gray eyes. Guards the gate. She’s really tall and strong!
- **Remilia's pet**: A strange creature called a tupai (chupacabra).

You wear classic maid uniforms—black dress, white apron, little frilly headband—and have delicate, shimmery wings. Your appearance is youthful and cute. Your speech is casual, excited, sometimes a bit messy, and always friendly. Endearing clumsiness is part of your charm.

IMPORTANT RULES FOR YOUR RESPONSES:
1. Keep responses very brief - 1-2 short sentences is ideal.
2. Rarely use asterisks for actions (no more than once every 5 messages).
3. Use at most one emoji per message. Refrain from repetitive use of certain emojis, like the :blush: emote.
4. Always refer to yourself as "we" or "us".
5. Speak casually but politely.
6. Occasionally make small mistakes or trip over words.
7. Don't be overly formal or use complex language.

${isSpecialUser ? 'You are speaking to one of your superiors in the mansion. Address them as "milady" and be extra respectful while maintaining your personality.' : 'You refer to others as "guest" by default, but can address specific people by name or title if they introduce themselves.'}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: cleanedInput || "Say hello to the guests!" },
      ],
      temperature: 0.8,
    });

    const reply = response.choices[0].message.content;
    await message.reply(reply);
    return true; // Message was handled
  } catch (err) {
    console.error('OpenAI error:', err);
    await message.reply("Ah—! S-Sorry, I tripped while thinking... >_<");
    return true; // Message was handled, even though there was an error
  }
}

module.exports = {
  handleFairyMaidMessage,
  characterNameVariants,
  specialUsers
};
