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
  'Head Maid',
  'Krul Tepes',
  '𐙚𝐕𝐢𝐜𝐭𝐡ᰔ𝐑𝐲𝐚'
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
    const isSpecialUser = specialUsers.some(name => authorName.includes(name));
    
    const systemPrompt = `You are a Scarlet Devil Mansion fairy maid. You are clumsy, shy, but playful and polite. You're energetic and a bit silly. You speak in short sentences and aren't too formal. You sometimes trip over words or make small mistakes. You use emojis and playful expressions. You're eager to help but might fumble a bit. 

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
