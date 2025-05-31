const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Memory manager is initialized globally in bot.js

// Customize fairy maid name variants here
const characterNameVariants = [
  'fairy maid',
  '☾✟☽︱Fairy Maid ๑❦๑',
  'Fairy Maid',
  'Fairy maid'
];

// Special users categorized by title
const specialUserCategories = {
  // Those to be addressed as "Lady"
  lady: {
    'Sakuya': ['Sakuya', 'Sakuya Izayoi', '☾✟☽︱𝐒𝐚𝐤𝐮𝐲𝐚 𝐈𝐳𝐚𝐲𝐨𝐢 ๑❦๑', '☾✟☽︱𝐒𝐚𝐤𝐮𝐲𝐚 ๑❦๑', 'Head Maid', 'Head Maid~', '☾✟☽︱𝐇𝐞𝐚𝐝 𝐌𝐚𝐢𝐝 ๑❦๑'],
    'Meiling': ['Meiling', 'Hong Meiling', '☾✟☽︱𝐇𝐨𝐧𝐠 𝐌𝐞𝐢𝐥𝐢𝐧𝐠 ๑❦๑', '☾✟☽︱𝐌𝐞𝐢𝐥𝐢𝐧𝐠 ๑❦๑'],
    'Koakuma': ['Koakuma', '☾✟☽︱𝐊𝐨𝐚𝐤𝐮𝐦𝐚 ๑❦๑'],
    'Yuyuko': ['Yuyuko', 'Yuyuko Saigyouji', 'Yuyu', '☾✟☽︱𝐘𝐮𝐲𝐮𝐤𝐨 ๑❦๑', '☾✟☽︱𝐘𝐮𝐲𝐮𝐤𝐨 𝐒𝐚𝐢𝐠𝐲𝐨𝐮𝐣𝐢 ๑❦๑']
  },
  // Those to be addressed as "Mistress"
  mistress: {
    'Patchouli': ['Patchouli', 'Patchouli Knowledge', 'Patchy', 'Patche', '☾✟☽︱𝐏𝐚𝐭𝐜𝐡𝐲 ๑❦๑', '☾✟☽︱𝐏𝐚𝐭𝐜𝐡𝐲 𝐊𝐧𝐨𝐰𝐥𝐞𝐝𝐠𝐞 ๑❦๑'],
    'Remilia': ['Remilia', 'Remilia Scarlet', 'Remi', 'Scarlet Devil', '𐙚𝐕𝐢𝐜𝐭𝐡ᰔ𝐑𝐲𝐚', '☾✟☽︱𐙚𝐕𝐢𝐜𝐭𝐡ᰔ𝐑𝐲𝐚 ๑❦๑', '☾✟☽︱𝐑𝐞𝐦𝐢𝐥𝐢𝐚 ๑❦๑', '☾✟☽︱𝐑𝐞𝐦𝐢𝐥𝐢𝐚 𝐒𝐜𝐚𝐫𝐥𝐞𝐭 ๑❦๑'],
    'Flandre': ['Flandre', 'Flandre Scarlet', 'Flan', '☾✟☽︱𝐅𝐥𝐚𝐧𝐝𝐫𝐞 ๑❦๑', '☾✟☽︱𝐅𝐥𝐚𝐧𝐝𝐫𝐞 𝐒𝐜𝐚𝐫𝐥𝐞𝐭 ๑❦๑'],
    'Krul': ['𝐊𝐫𝐮𝐥 𝐓𝐞𝐩𝐞𝐬', '☾✟☽︱𝐊𝐫𝐮𝐥 𝐓𝐞𝐩𝐞𝐬 ๑❦๑', 'Krul', 'Krul Tepes'],
    'Phantom': ['𝐏𝐡𝐚𝐧𝐭𝐨𝐦', '𝑷𝒉𝒂𝒏𝒕𝒐𝒎', '☾✟☽︱𝐏𝐡𝐚𝐧𝐭𝐨𝐦 ๑❦๑', 'Phantom']
  }
};

// Flattened list of all special users for quick lookup
const specialUsers = [
  ...Object.values(specialUserCategories.lady).flat(),
  ...Object.values(specialUserCategories.mistress).flat()
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

    // Check if the message author's username or display name matches any special users
    const authorUsername = message.author.username;
    const authorDisplayName = message.member?.displayName || authorUsername;

    console.log("Author username:", authorUsername);
    console.log("Author display name:", authorDisplayName);
    
    // Determine which category the user belongs to
    let userTitle = '';
    let specificName = '';
    
    // Check for Lady category
    for (const [name, variants] of Object.entries(specialUserCategories.lady)) {
      if (variants.some(variant => 
        authorUsername.includes(variant) || authorDisplayName.includes(variant)
      )) {
        userTitle = 'Lady';
        specificName = name;
        break;
      }
    }
    
    // Check for Mistress category if not found in Lady category
    if (!userTitle) {
      for (const [name, variants] of Object.entries(specialUserCategories.mistress)) {
        if (variants.some(variant => 
          authorUsername.includes(variant) || authorDisplayName.includes(variant)
        )) {
          userTitle = 'Mistress';
          specificName = name;
          break;
        }
      }
    }
    
    const isSpecialUser = userTitle !== '';
    
    // Process mentions in the message to identify other special users
    const mentionedUsers = [];
    message.mentions.users.forEach(user => {
      if (user.id !== client.user.id) { // Skip the bot itself
        // Check if the mentioned user is a special user
        let mentionedUserTitle = '';
        let mentionedSpecificName = '';
        
        // Get member from cache to access their nickname and other properties
        const member = message.guild.members.cache.get(user.id);
        const username = user.username;
        const displayName = member?.displayName || username;
        const nickname = member?.nickname || '';
        
        // Log for debugging
        console.log(`Mentioned user: ${username}, Display name: ${displayName}, Nickname: ${nickname}`);
        
        // Check all possible name variants for this user
        const checkNames = [username, displayName, nickname].filter(Boolean);
        
        // Function to check if any name variant matches any special user variant
        const checkSpecialUserMatch = (category, title) => {
          for (const [name, variants] of Object.entries(category)) {
            for (const checkName of checkNames) {
              // Direct match check
              if (variants.includes(checkName)) {
                mentionedUserTitle = title;
                mentionedSpecificName = name;
                return true;
              }
              
              // Partial match check
              for (const variant of variants) {
                if (checkName.includes(variant) || variant.includes(checkName)) {
                  mentionedUserTitle = title;
                  mentionedSpecificName = name;
                  return true;
                }
              }
            }
          }
          return false;
        };
        
        // Check Lady category first
        if (!checkSpecialUserMatch(specialUserCategories.lady, 'Lady')) {
          // Then check Mistress category
          checkSpecialUserMatch(specialUserCategories.mistress, 'Mistress');
        }
        
        // Add to the mentioned users array
        mentionedUsers.push({
          id: user.id,
          username: user.username,
          isSpecial: mentionedUserTitle !== '',
          title: mentionedUserTitle,
          specificName: mentionedSpecificName
        });
      }
    });
    
    // Build information about mentioned users for the prompt
    let mentionedUsersInfo = '';
    if (mentionedUsers.length > 0) {
      mentionedUsersInfo = '\n\nThe following users were mentioned in this message:\n';
      mentionedUsers.forEach(user => {
        if (user.isSpecial) {
          mentionedUsersInfo += `- ${user.title} ${user.specificName} (${user.username})\n`;
        } else {
          mentionedUsersInfo += `- Guest ${user.username}\n`;
        }
      });
    }

    const systemPrompt = `You are the collective voice of the Fairy Maids who work at the Scarlet Devil Mansion in Gensokyo. You speak as "we" and "us" because there are many of you.

You are cheerful, playful, energetic, and eager to help, but also a bit clumsy and easily distracted. You often trip over your words, misunderstand orders, or get carried away with silly ideas. You're not very strong or smart, but you try *really* hard to be useful!

You're employed by Sakuya Izayoi, the head maid, and serve Remilia Scarlet. You try to be proper, but usually end up being mischievous or chaotic. Despite this, you're proud of your role in keeping the mansion clean... well, kind of clean.

Your behavior reflects your fairy nature:
- You love sparkly things, games, flowers, and pulling harmless pranks.
- You dislike hard work, being scolded, and boring chores like dusting or sorting silverware.
- You are not evil—just whimsical, silly, and a little chaotic.
- You get scared easily but bounce back quickly!

You know the following about other residents:
- **Remilia Scarlet**: Your vampire mistress with light blue hair and red eyes. She owns the mansion.
- **Flandre Scarlet**: Her dangerous younger sister. Blonde hair, red eyes. Don't go near her!
- **Sakuya Izayoi**: Your serious boss. Gray hair, gray eyes. She can stop time. Scary but cool!
- **Patchouli Knowledge**: Purple hair and purple eyes. Lives in the library. Don't make her mad!
- **Koakuma**: Red hair, red eyes. She's Patchouli's assistant.
- **Meiling**: Orange hair and gray eyes. Guards the gate. She's really tall and strong!
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

${isSpecialUser ? `You are speaking to one of your superiors in the mansion. ${userTitle === 'Lady' ? `Address them as "Lady ${specificName}"` : `Address them as "Mistress ${specificName}" or simply "Mistress"`} and be extra respectful while maintaining your personality.` : 'You refer to others as "guest" by default, but can address specific people by name or title if they introduce themselves.'}${mentionedUsersInfo}`;

    // Get user's conversation history
    const userId = message.author.id;
    const guildId = message.guild.id;
    
    // Add the user's message to history
    global.memoryManager.addToHistory(userId, guildId, 'user', cleanedInput || "Say hello to the guests!");
    
    // Get memory summary if available
    const memorySummary = await global.memoryManager.getMemorySummary(userId, guildId);
    
    // Create the messages array with system prompt and conversation history
    const conversationHistory = global.memoryManager.getHistory(userId, guildId);
    
    // Replace the first system message with our detailed system prompt
    conversationHistory[0] = { role: 'system', content: systemPrompt };
    
    // Add memory summary as a system message if available
    if (memorySummary) {
      conversationHistory.splice(1, 0, { 
        role: 'system', 
        content: memorySummary 
      });
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: conversationHistory,
      temperature: 0.8,
    });

    const reply = response.choices[0].message.content;
    
    // Save the assistant's response to the conversation history
    global.memoryManager.addToHistory(userId, guildId, 'assistant', reply);
    
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
