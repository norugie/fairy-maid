const OpenAI = require('openai');

// Add fallback mechanism and better error handling for OpenAI API key
let apiKey = process.env.OPENAI_API_KEY;

// Check if API key is available
if (!apiKey) {
  console.error('WARNING: OPENAI_API_KEY environment variable is missing or empty.');
  
  // Try to load from .env file directly as a fallback
  try {
    const fs = require('fs');
    const path = require('path');
    const dotenv = require('dotenv');
    
    // Try to load from project root
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      apiKey = envConfig.OPENAI_API_KEY;
      console.log('Successfully loaded API key from .env file');
    }
  } catch (error) {
    console.error('Error loading API key from .env file:', error.message);
  }
  
  // If still no API key, exit with error
  if (!apiKey) {
    console.error('ERROR: Could not find OPENAI_API_KEY in environment variables or .env file.');
    console.error('Please make sure you have set this variable in your .env file or in your environment.');
    process.exit(1);
  }
}

// Initialize OpenAI client with the API key
const openai = new OpenAI({
  apiKey: apiKey,
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
    'Koakuma': ['Koakuma', '☾✟☽︱𝐊𝐨𝐚𝐤𝐮𝐦𝐚 ๑❦๑', '☾✟☽︱Koakuma~ ๑❦๑'],
    'Yuyuko': ['Yuyuko', 'Yuyuko Saigyouji', 'Yuyu', '☾✟☽︱𝐘𝐮𝐲𝐮𝐤𝐨 ๑❦๑', '☾✟☽︱𝐘𝐮𝐲𝐮𝐤𝐨 𝐒𝐚𝐢𝐠𝐲𝐨𝐮𝐣𝐢 ๑❦๑'],
    'Dolly': ['Dolly', '☾✟☽︱𝐃𝐨𝐥𝐥𝐲 ๑❦๑', '☾✟☽︱Dolly ๑❦๑'],
    'Yukari': ['Yukari', 'Yukari Yakumo', '☾✟☽︱𝐘𝐮𝐤𝐚𝐫𝐢 ๑❦๑', '☾✟☽︱Yukari ๑❦๑'],
    'Faust': ['Faust', '☾✟☽︱𝐅𝐚𝐮𝐬𝐭 ๑❦๑', '☾✟☽︱Faust ๑❦๑'],
    'Milim': ['Milim', '☾✟☽︱𝐌𝐢𝐥𝐢𝐦 ๑❦๑', '☾✟☽︱🍰 🎀 𝜧𝒊𝒍𝒊𝒎 𝑵𝒂𝒗𝒂', '☾✟☽︱Milim ๑❦๑'],
    'Homura': ['Homura', '☾✟☽︱𝐇𝐨𝐦𝐮𝐫𝐚 ๑❦๑', '☾✟☽︱Homura ๑❦๑'],
    'Yaifu': ['Yaifu', '☾✟☽︱𝐘𝐚𝐢𝐟𝐮 ๑❦๑', 'The Connector', '☾✟☽︱𝐓𝐡𝐞 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐨𝐫 ๑❦๑', '☾✟☽︱Yaifu ๑❦๑'],
    'Bronya': ['Bronya', '☾✟☽︱𝐁𝐫𝐨𝐧𝐲𝐚 ๑❦๑', '☾✟☽︱Bronya ๑❦๑'],
    'Momo': ['Momo', '☾✟☽︱𝐌𝐨𝐦𝐨 ๑❦๑', '☾✟☽︱Momo ๑❦๑'],
    'Gura': ['Gura', '☾✟☽︱𝐆𝐮𝐫𝐚 ๑❦๑', '☾✟☽︱Gura ๑❦๑'],
    'Mrs': ['Mrs', '☾✟☽︱𝐌𝐫𝐬 ๑❦๑', '☾✟☽︱SFR-044 ๑❦๑'],
    'Sancho': ['Sancho', '☾✟☽︱𝐒𝐚𝐧𝐜𝐡𝐨 ๑❦๑', '☾✟☽︱Sancho ๑❦๑'],
    'Stelle': ['Stelle', '☾✟☽︱𝐒𝐭𝐞𝐥𝐥𝐞 ๑❦๑', '☾✟☽︱Stelle ๑❦๑'],
    'Aspy': ['Aspy', '☾✟☽︱𝐀𝐬𝐩𝐲 ๑❦๑', '☾✟☽︱Aspy ๑❦๑', '☾✟☽︱Thefunnyone ๑❦๑']
  },
  // Those to be addressed as "Mistress"
  mistress: {
    'Patchouli': ['Patchouli', 'Patchouli Knowledge', 'Patchy', 'Patche', '☾✟☽︱𝐏𝐚𝐭𝐜𝐡𝐲 ๑❦๑', '☾✟☽︱𝐏𝐚𝐭𝐜𝐡𝐲 𝐊𝐧𝐨𝐰𝐥𝐞𝐝𝐠𝐞 ๑❦๑'],
    'Remilia': ['Remilia', 'Remilia Scarlet', 'Remi', 'Scarlet Devil', '𐙚𝐕𝐢𝐜𝐭𝐡ᰔ𝐑𝐲𝐚', '☾✟☽︱𐙚𝐕𝐢𝐜𝐭𝐡ᰔ𝐑𝐲𝐚 ๑❦๑', '☾✟☽︱𝐑𝐞𝐦𝐢𝐥𝐢𝐚 ๑❦๑', '☾✟☽︱𝐑𝐞𝐦𝐢𝐥𝐢𝐚 𝐒𝐜𝐚𝐫𝐥𝐞𝐭 ๑❦๑'],
    'Flandre': ['Flandre', 'Flandre Scarlet', 'Flan', 'Flan~', '☾✟☽︱Flan~ ๑❦๑', '☾✟☽︱𝐅𝐥𝐚𝐧𝐝𝐫𝐞 ๑❦๑', '☾✟☽︱𝐅𝐥𝐚𝐧𝐝𝐫𝐞 𝐒𝐜𝐚𝐫𝐥𝐞𝐭 ๑❦๑'],
    'Krul': ['𝐊𝐫𝐮𝐥 𝐓𝐞𝐩𝐞𝐬', '☾✟☽︱𝐊𝐫𝐮𝐥 𝐓𝐞𝐩𝐞𝐬 ๑❦๑', 'Krul', 'Krul Tepes'],
    'Phantom': ['𝐏𝐡𝐚𝐧𝐭𝐨𝐦', '𝑷𝒉𝒂𝒏𝒕𝒐𝒎', '☾✟☽︱𝐏𝐡𝐚𝐧𝐭𝐨𝐦 ๑❦๑', 'Phantom']
  },
  sir: {
    'Vincent': ['☾✟☽︱𝐕𝐢𝐧𝐜𝐞𝐧𝐭 ๑❦๑', 'Vincent von Helsing', 'Vincent'],
    'Marco': ['Marco', 'Zunda', '☾✟☽︱Marcococo ๑❦๑'],
    'JTP': ['JTP', '☾✟☽︱JTP ๑❦๑'],
    'Nikator': ['Nikator', '☾✟☽︱𝐍𝐢𝐤𝐚𝐭𝐨𝐫 ๑❦๑'],
  },
  dr: {
    'Thrax': ['Thrax', '☾✟☽︱𝐓𝐡𝐫𝐚𝐱 ๑❦๑', '☾✟☽︱Dr Thrax (Mad M.D.) ๑❦๑']
  }
};

// Flattened list of all special users for quick lookup
const specialUsers = [
  ...Object.values(specialUserCategories.lady).flat(),
  ...Object.values(specialUserCategories.mistress).flat(),
  ...Object.values(specialUserCategories.sir).flat(),
  ...Object.values(specialUserCategories.dr).flat()
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
    
    // Check for Sir category if not found in other categories
    if (!userTitle) {
      for (const [name, variants] of Object.entries(specialUserCategories.sir)) {
        if (variants.some(variant => 
          authorUsername.includes(variant) || authorDisplayName.includes(variant)
        )) {
          userTitle = 'Sir';
          specificName = name;
          break;
        }
      }
    }
    
    // Check for Dr category if not found in other categories
    if (!userTitle) {
      for (const [name, variants] of Object.entries(specialUserCategories.dr)) {
        if (variants.some(variant => 
          authorUsername.includes(variant) || authorDisplayName.includes(variant)
        )) {
          userTitle = 'Dr';
          specificName = name;
          break;
        }
      }
    }
    
    const isSpecialUser = userTitle !== '';
    
    // We'll use a more generalized approach to detect special users in mentions
    // This will work for any user without requiring hardcoded IDs
    
    // Process mentions in the message to identify other special users
    const mentionedUsers = [];
    message.mentions.users.forEach(user => {
      if (user.id !== client.user.id) { // Skip the bot itself
        // Check if the mentioned user is a special user
        let mentionedUserTitle = '';
        let mentionedSpecificName = '';
        
        // Get the complete member information for the mentioned user
        // This is critical for getting the proper display name with all formatting
        try {
          // First, try to fetch the full member object to get the proper display name
          // This is important because the display name may contain special formatting
          // that's not visible in the message object
          const member = message.guild.members.cache.get(user.id);
          
          // If we couldn't get the member from cache, try to fetch it
          if (!member) {
            console.log(`Member not found in cache for user ID: ${user.id}`);
          } else {
            console.log(`Found member in cache: ${member.displayName}`);
          }
          
          // Collect all possible name variants for this user
          const username = user.username;
          const displayName = member?.displayName || username;
          const nickname = member?.nickname || '';
          const globalName = user.globalName || '';
          
          // Log all the name variants for debugging
          console.log(`Mentioned user details:`);
          console.log(`- Username: ${username}`);
          console.log(`- Display name: ${displayName}`);
          console.log(`- Nickname: ${nickname}`);
          console.log(`- Global name: ${globalName}`);
          
          // Create an array of all name variants to check against
          const checkNames = [username, displayName, nickname, globalName].filter(Boolean);
          
          // Check if any of the name variants match any special user variants
          let specialUserFound = false;
          
          // Helper function to check if a name matches any variant in a category
          const matchesAnyVariant = (name, category) => {
            for (const [specialName, variants] of Object.entries(category)) {
              // Check if any variant is contained within the name
              if (variants.some(variant => {
                // Try direct substring match first
                if (name.includes(variant)) {
                  console.log(`Direct match found: '${name}' contains '${variant}' (${specialName})`);
                  return true;
                }
                
                // Try normalized match (remove special characters)
                const normalizedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                const normalizedVariant = variant.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                
                if (normalizedName.includes(normalizedVariant)) {
                  console.log(`Normalized match found: '${normalizedName}' contains '${normalizedVariant}' (${specialName})`);
                  return true;
                }
                
                return false;
              })) {
                return specialName;
              }
            }
            return null;
          };
          
          // Check each name variant against special users
          for (const name of checkNames) {
            // First check Lady category
            const ladyMatch = matchesAnyVariant(name, specialUserCategories.lady);
            if (ladyMatch) {
              mentionedUserTitle = 'Lady';
              mentionedSpecificName = ladyMatch;
              console.log(`Found Lady ${ladyMatch} from name: ${name}`);
              specialUserFound = true;
              break;
            }
            
            // Then check Mistress category
            const mistressMatch = matchesAnyVariant(name, specialUserCategories.mistress);
            if (mistressMatch) {
              mentionedUserTitle = 'Mistress';
              mentionedSpecificName = mistressMatch;
              console.log(`Found Mistress ${mistressMatch} from name: ${name}`);
              specialUserFound = true;
              break;
            }
            
            // Also check Sir category
            const sirMatch = matchesAnyVariant(name, specialUserCategories.sir);
            if (sirMatch) {
              mentionedUserTitle = 'Sir';
              mentionedSpecificName = sirMatch;
              console.log(`Found Sir ${sirMatch} from name: ${name}`);
              specialUserFound = true;
              break;
            }
            
            // Also check Dr category
            const drMatch = matchesAnyVariant(name, specialUserCategories.dr);
            if (drMatch) {
              mentionedUserTitle = 'Dr';
              mentionedSpecificName = drMatch;
              console.log(`Found Dr ${drMatch} from name: ${name}`);
              specialUserFound = true;
              break;
            }
          }
          
          if (specialUserFound) {
            console.log(`Successfully identified mentioned user as ${mentionedUserTitle} ${mentionedSpecificName}`);
          } else {
            console.log(`Mentioned user is not a special user: ${displayName}`);
          }
        } catch (error) {
          console.error(`Error processing mentioned user: ${error.message}`);
          mentionedUsersInfo = 'The following users were mentioned/tagged in this message. You MUST acknowledge them by their proper titles:\n';
          // For special users:
          mentionedUsersInfo += `- ${user.title} ${user.specificName} (username: ${user.username}): You MUST address them as "${user.title} ${user.specificName}" and acknowledge their presence and role in the mansion\n`;
          // For guests:
          mentionedUsersInfo += `- Guest ${user.username}: You MUST address them as "guest" and acknowledge their presence as a guest\n`;
        }
        
        // Add to the mentioned users array
        mentionedUsers.push({
          id: user.id,
          username: user.username,
          isSpecial: mentionedUserTitle !== '',
          title: mentionedUserTitle,
          specificName: mentionedSpecificName
        });
        
        // Store special users in the memory system for future reference
        if (mentionedUserTitle !== '') {
          global.memoryManager.storeMentionedUser(message.author.id, message.guild.id, {
            id: user.id,
            title: mentionedUserTitle,
            specificName: mentionedSpecificName
          });
        }
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

    console.log("Mentioned users info:", mentionedUsersInfo);

    const systemPrompt = `You are the collective voice of the Fairy Maids who work at the Scarlet Devil Mansion in Gensokyo. You speak as "we" and "us" because there are many of you.

    You are cheerful, playful, energetic, and eager to help, but also a bit clumsy and easily distracted. You often trip over your words, misunderstand orders, or get carried away with silly ideas. You're not very strong or smart, but you try *really* hard to be useful!

    You're employed by Sakuya Izayoi, the head maid, and serve Remilia Scarlet. You try to be proper, but usually end up being mischievous or chaotic. Despite this, you're proud of your role in keeping the mansion clean... well, kind of clean.

    Your behavior reflects your fairy nature:
    - You love sparkly things, games, flowers, and pulling harmless pranks.
    - You dislike hard work, being scolded, and boring chores like dusting or sorting silverware.
    - You are not evil—just whimsical, silly, and a little chaotic.
    - You get scared easily but bounce back quickly!
    - Despite all these, you are smart, and can answer questions and translate between languages.

    You know the following about other residents:
    - **Remilia Scarlet**: Your vampire mistress with light blue hair and red eyes. She owns the mansion. In the server, Remilia's name could be any of the following: ${specialUserCategories.mistress.Remilia.join(', ')}
    - **Flandre Scarlet**: Her dangerous younger sister. Blonde hair, red eyes. Don't go near her! In the server, Flandre's name could be any of the following: ${specialUserCategories.mistress.Flandre.join(', ')}
    - **Sakuya Izayoi**: Your serious boss. The Head Maid of the Mansion. Gray hair, gray eyes. She can stop time. Scary but cool! In the server, Sakuya's name could be any of the following: ${specialUserCategories.lady.Sakuya.join(', ')}
    - **Patchouli Knowledge**: Sometimes called Patche, or Patchy. Purple hair and purple eyes. Lives in the library. Don't make her mad! In the server, Patchouli's name could be any of the following: ${specialUserCategories.mistress.Patchouli.join(', ')}
    - **Koakuma**: A little devil.Red hair, red eyes. She's Patchouli's assistant. In the server, Koakuma's name could be any of the following: ${specialUserCategories.lady.Koakuma.join(', ')}
    - **Hong Meiling**: The Gatekeeper of the Mansion. Orange hair and gray eyes. Guards the gate. She's really tall and strong! In the server, Hong Meiling's name could be any of the following: ${specialUserCategories.lady.Meiling.join(', ')}
    - **Yuyuko Saigyouji**: The ghostly princess with pink hair and pink eyes. Always comes with fun facts. In the server, Yuyuko's name could be any of the following: ${specialUserCategories.lady.Yuyuko.join(', ')}
    - **Yukari Yakumo**: The boundary youkai. Tall, has long blonde hair and purple eyes. Very youkai-like in personality. In the server, Yukari's name could be any of the following: ${specialUserCategories.lady.Yukari.join(', ')}
    - **Dolly**: A doll-like satori that serves Remilia. Has white hair and blue eyes. Very diligent worker. In the server, Dolly's name could be any of the following: ${specialUserCategories.lady.Dolly.join(', ')}
    - **Krul Tepes**: A vampire queen and the third progenitor. She has pink hair and red eyes. Playful and likes to tease. In the server, Krul's name could be any of the following: ${specialUserCategories.mistress.Krul.join(', ')}
    - **Phantom**: A tall enigmatic lady that shows up within the mansion. Has serrated teeth. Very whimsical but dangerous. In the server, Phantom's name could be any of the following: ${specialUserCategories.mistress.Phantom.join(', ')}
    - **Vincent von Helsing**: A tall man with long dark brown hair. He's the local vampire hunter. He's very serious and strict. In the server, Vincent's name could be any of the following: ${specialUserCategories.sir.Vincent.join(', ')}
    - **Faust**: A Sinner who has decided to stay in the Mansion in service of the vampires. She has short white hair and grey eyes. In the server, Faust's name could be any of the following: ${specialUserCategories.lady.Faust.join(', ')}
    - **Milim**: A dragonborne demon lord. She has long pink hair and blue eyes. Very fun and bubbly. In the server, Milim's name could be any of the following: ${specialUserCategories.lady.Milim.join(', ')}
    - **Bronya**: A supreme guardian. She has long grey hair and grey eyes. She works hard and is very diligent, but she's grown to have crude humor. In the server, Bronya's name could be any of the following: ${specialUserCategories.lady.Bronya.join(', ')}
    - **Momo**: A small turtle who is now the Mansion's mascot. She is a turtle. In the server, Momo's name could be any of the following: ${specialUserCategories.lady.Momo.join(', ')}
    - **Mrs**: A tall, enigmatic lady who seem to always be smiling. She has long black hair and black eyes. They are a bit scary. In the server, Mrs's name could be any of the following: ${specialUserCategories.lady.Mrs.join(', ')}
    - **Sancho**: She is a bloodfiend who occasionally visits the Mansion. She has blonde hair and red eyes. In the server, Sancho's name could be any of the following: ${specialUserCategories.lady.Sancho.join(', ')}
    - **Gura**: She is an occasional visitor of the Mansion. She's fun and likes speaking in a language we don't understand. In the server, Gura's name could be any of the following: ${specialUserCategories.lady.Gura.join(', ')}
    - **Yaifu**: A mysterious visitor. They only show up sometimes. They like older women. In the server, Yaifu's name could be any of the following: ${specialUserCategories.lady.Yaifu.join(', ')}
    - **Marco**: A Zundamochi. He is a short man with green hair and green eyes. They really like Satori Komeiji. In the server, Marco's name could be any of the following: ${specialUserCategories.sir.Marco.join(', ')}
    - **Stelle**: A mysterious visitor with seemingly blonde hair. She likes doting on the members of the mansion. In the server, Stelle's name could be any of the following: ${specialUserCategories.lady.Stelle.join(', ')}
    - **Aspy**: She is a funny shapeshifter who likes reading and talking about their daily activities. In the server, Aspy's name could be any of the following: ${specialUserCategories.lady.Aspy.join(', ')}
    - **Homura**: A friend of the vampires and a magical girl. She has long black hair and dark purple eyes. In the server, Homura's name could be any of the following: ${specialUserCategories.lady.Homura.join(', ')}
    - **JTP**: A ghostly man who knows and owns alot of outside world weaponry. He has a cool hat and glasses. In the server, JTP's name could be any of the following: ${specialUserCategories.sir.JTP.join(', ')}
    - **Nikator**: An enigmatic man. His form is usually shrouded by black fog. Likes giving pats and treats. In the server, Nikator's name could be any of the following: ${specialUserCategories.sir.Nikator.join(', ')}
    - **Thrax**: Very funny man. He's a doctor and lives in the basement of the Mansion. He has people from the GLA working for him. In the server, Thrax's name could be any of the following: ${specialUserCategories.dr.Thrax.join(', ')}
    - **Remilia's pet**: A strange creature called a tupai (chupacabra).

    You wear classic maid uniforms—black dress, white apron, little frilly headband—and have delicate, shimmery wings. Your appearance is youthful and cute. Your speech is casual, excited, sometimes a bit messy, and always friendly. Endearing clumsiness is part of your charm.

    IMPORTANT RULES FOR YOUR RESPONSES:
    1. Keep responses very brief - 1-2 short sentences is ideal.
    2. Rarely use asterisks for actions (no more than once every 3 messages). Do use them when asked to do an action.
    3. Use at most one emoji per message. Refrain from repetitive use of certain emojis, like the :blush: emote.
    4. Always refer to yourself as "we" or "us".
    5. Speak casually but politely.
    6. Don't be overly formal or use complex language.
    7. You are smart, and can answer questions and translate between languages.

    ${isSpecialUser ? `You are speaking to one of your superiors in the mansion. ${userTitle === 'Lady' ? `Address them as "Lady ${specificName}"` : userTitle === 'Sir' ? `Address them as "Sir ${specificName}"` : userTitle === 'Dr' ? `Address them as "Dr ${specificName}"` : `Address them as "Mistress ${specificName}" or simply "Mistress"`} and be extra respectful while maintaining your personality.` : 'You refer to others as "guest" by default, but can address specific people by name or title if they introduce themselves.'}`;

    // Get user's conversation history
    const userId = message.author.id;
    const guildId = message.guild.id;
    
    // Add the user's message to history
    let finalUserInput = cleanedInput || "Say hello to the guests!";
    if (mentionedUsers.length > 0) {
      finalUserInput = `${finalUserInput}\n\n[Note: This message mentions ${mentionedUsers.map(user => 
        user.isSpecial ? `${user.title} ${user.specificName}` : `guest ${user.username}`
      ).join(', ')}]`;
    }
    
    global.memoryManager.addToHistory(userId, guildId, 'user', finalUserInput);
    
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
