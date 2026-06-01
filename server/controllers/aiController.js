const User = require('../models/User');
const Listing = require('../models/Listing');

// Local database of activities for itinerary days template construction
const REGIONAL_ACTIVITIES = {
  jaipur: [
    { title: "Heritage Arrival & Fort Sunset", items: ["Check-in at your stay.", "Enjoy traditional Pyaaz Kachoris at MI Road.", "Visit the historic Hawa Mahal.", "Watch the sunset from Nahargarh Fort with masala chai."] },
    { title: "Forts, Pottery & Folk Traditions", items: ["Explore Amer Fort and the Sheesh Mahal.", "Participate in a blue pottery workshop.", "Shop at Johri Bazar for local block-print textiles.", "Dine at Chokhi Dhani with traditional folk dances."] },
    { title: "Peaceful Temples & Lassi Treats", items: ["Attend Govind Dev Ji Temple morning prayers.", "Have a famous kulhad lassi at MI Road.", "Explore the Albert Hall Museum before departure."] }
  ],
  goa: [
    { title: "Latin Quarter Walk & Spice Gardens", items: ["Check-in at your local villa.", "Walk through the historic Latin Quarter of Fontainhas.", "Tour a spice plantation in Ponda.", "Relax with a Mandovi River sunset cruise."] },
    { title: "Coastal Forts & Beach Sunset", items: ["Explore Fort Aguada ruins.", "Eat fresh fish curry rice at an Anjuna Beach shack.", "Try water sports at Ashwem Beach.", "Enjoy live music at a Vagator cliffside cafe."] }
  ],
  kerala: [
    { title: "Houseboat Check-In & Backwater Cruise", items: ["Board your Kettuvallam houseboat.", "Cruise along the scenic backwater canals.", "Feast on pearl spot fish cooked in banana leaf.", "Relax as the sun sets over the palm trees."] },
    { title: "Fort Kochi Heritage & Culture", items: ["Visit the Chinese Fishing Nets and Mattancherry Palace.", "See a classical Kathakali dance performance.", "Shop for organic spices at local bazaars."] }
  ],
  manali: [
    { title: "Riverside Quiet & Pine Walks", items: ["Check-in at your mountain cottage.", "Hike through deodar forests of Van Vihar.", "Visit the ancient wooden Hadimba Temple.", "Dine in Old Manali trying Himachali Siddu."] },
    { title: "Solang Valley Snow Adventure", items: ["Go paragliding or snowboarding in Solang Valley.", "Drive through the Atal Tunnel.", "Soak in the Vashisht hot springs."] }
  ],
  varanasi: [
    { title: "Sacred Ghats & Ganga Aarti", items: ["Check-in to your ghat-facing stay.", "Walk through the ancient galis of Kashi.", "Take a sunset boat ride to see the Ganga Aarti.", "Try local Tamatar Chaat and Rabri-Jalebi."] },
    { title: "Sunrise Rowboat & Sarnath Tour", items: ["Take a 5 AM rowboat ride during sunrise.", "Visit Sarnath Dhamek Stupa where Buddha preached.", "See Banarasi silk saree weavers in action."] }
  ]
};

// Generic generator for custom day-by-day activities
const generateActivitiesForDay = (day, interests) => {
  const selectedInterests = interests.length > 0 ? interests : ["Heritage & History", "Street Food Trails", "Nature Walks"];
  const interest = selectedInterests[(day - 1) % selectedInterests.length];
  
  if (day === 1) {
    return {
      title: `Arrival & local ${interest} immersion`,
      items: [
        "Arrive and check in to your verified stay.",
        "Savor a traditional welcome beverage and talk with your host about neighborhood secrets.",
        `Indulge in a local lunch highlighting regional specialty dishes.`,
        `Spend a relaxed evening strolling around native markets.`
      ]
    };
  }
  
  return {
    title: `Exploring ${interest}`,
    items: [
      `Take a guided morning tour to experience ${interest} in the area.`,
      "Enjoy a cooking demonstration at the stay to learn family recipes.",
      "Explore local craft galleries or scenic lookout points.",
      "Join a native evening performance or storytelling session at the stay."
    ]
  };
};

// Helper cost modeling function
const calculateCostMath = (city, days, travelers, comfortClass, season) => {
  let lodgingBase = 1500;
  let foodBase = 600;
  let transitBase = 500;
  let activityBase = 400;

  if (comfortClass === 'luxury') {
    lodgingBase = 6000;
    foodBase = 2000;
    transitBase = 2000;
    activityBase = 1500;
  } else if (comfortClass === 'mid-range') {
    lodgingBase = 3000;
    foodBase = 1000;
    transitBase = 900;
    activityBase = 800;
  }

  let cityMultiplier = 1.0;
  const metros = ['mumbai', 'delhi', 'bangalore', 'chennai'];
  const popularTourist = ['goa', 'jaipur', 'manali', 'udaipur', 'agra'];
  const heritageValue = ['varanasi', 'alleppey'];

  const cLower = city.toLowerCase();
  if (metros.includes(cLower)) cityMultiplier = 1.35;
  else if (popularTourist.includes(cLower)) cityMultiplier = 1.15;
  else if (heritageValue.includes(cLower)) cityMultiplier = 0.9;

  let seasonalMultiplier = 1.0;
  if (season === 'peak') seasonalMultiplier = 1.25; 
  else if (season === 'monsoon') seasonalMultiplier = 0.8;

  const lodgingTotal = Math.round(lodgingBase * days * cityMultiplier * seasonalMultiplier);
  const foodTotal = Math.round(foodBase * days * travelers * seasonalMultiplier);
  const transitTotal = Math.round(transitBase * days * cityMultiplier);
  const activitiesTotal = Math.round(activityBase * days * travelers);

  const totalCost = lodgingTotal + foodTotal + transitTotal + activitiesTotal;

  return {
    totalCost,
    breakdown: {
      lodging: lodgingTotal,
      food: foodTotal,
      transit: transitTotal,
      activities: activitiesTotal
    }
  };
};

// @desc    Generate customized travel itinerary with real database stays recommendation
// @route   POST /api/ai/planner
// @access  Public
const generateItinerary = async (req, res, next) => {
  try {
    const { destination, duration, budget, interests } = req.body;

    if (!destination) {
      res.status(400);
      return next(new Error('Please specify a destination city'));
    }

    const daysCount = Math.min(Math.max(Number(duration) || 3, 1), 10);
    const interestsList = Array.isArray(interests) ? interests : [];
    const destLower = destination.toLowerCase().trim();

    // 1. Fetch real stays from the database matching the destination
    const matchedStays = await Listing.find({
      $or: [
        { 'location.city': new RegExp(destination, 'i') },
        { 'location.state': new RegExp(destination, 'i') }
      ]
    }).populate('host', 'name');

    let suggestedStay = "Verified Local Homestay";
    let suggestedStayId = null;

    if (matchedStays.length > 0) {
      const bestStay = matchedStays[0];
      suggestedStay = bestStay.title;
      suggestedStayId = bestStay._id;
    } else {
      // If no stays match this city, find any stay in database to recommend
      const alternativeStays = await Listing.find().limit(1);
      if (alternativeStays.length > 0) {
        suggestedStay = alternativeStays[0].title + ` (in ${alternativeStays[0].location.city})`;
        suggestedStayId = alternativeStays[0]._id;
      }
    }

    // 2. Generate activities: use regional presets if available, else generate custom
    const days = [];
    const presetActivities = REGIONAL_ACTIVITIES[destLower];

    for (let i = 1; i <= daysCount; i++) {
      if (presetActivities && presetActivities[i - 1]) {
        days.push({
          day: i,
          title: `Day ${i}: ${presetActivities[i - 1].title}`,
          activities: presetActivities[i - 1].items
        });
      } else {
        const generated = generateActivitiesForDay(i, interestsList);
        days.push({
          day: i,
          title: `Day ${i}: ${generated.title}`,
          activities: generated.items
        });
      }
    }

    // Append real stay details to Day 1 check-in activities
    if (days[0] && matchedStays.length > 0) {
      days[0].activities.unshift(`Arrive and check in to your booked stay: ${matchedStays[0].title} located at ${matchedStays[0].location.address}.`);
    }

    // Compute cost predictions
    const costPrediction = calculateCostMath(destLower, daysCount, 1, 'mid-range', 'mid');

    res.status(200).json({
      success: true,
      source: matchedStays.length > 0 ? 'Database Match & Local Planner' : 'General Planner & Recommendations',
      data: {
        destination,
        duration: daysCount,
        suggestedStay,
        suggestedStayId,
        days,
        estimatedCost: costPrediction.totalCost,
        costBreakdown: costPrediction.breakdown
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    AapnaGhar chatbot advisor with database-driven recommendations
// @route   POST /api/ai/chat
// @access  Public
const chatWithAssistant = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400);
      return next(new Error('Chat messages history is required'));
    }

    const lastUserMessage = messages[messages.length - 1].text || '';
    const query = lastUserMessage.toLowerCase();

    // 1. Distinct city names from Listing collection to find if user is asking about a location
    const allCities = await Listing.distinct('location.city');
    let matchedCity = null;

    for (const city of allCities) {
      if (query.includes(city.toLowerCase())) {
        matchedCity = city;
        break;
      }
    }

    let botReply = "";

    // 2. Query DB and compose response based on matched city or keywords
    if (matchedCity) {
      const stays = await Listing.find({
        'location.city': new RegExp(matchedCity, 'i')
      }).populate('host', 'name').limit(2);

      if (stays.length > 0) {
        botReply = `Namaste! Stays in **${matchedCity}** are wonderful. Here are some verified options on our platform:\n\n` +
          stays.map(s => `🏡 **${s.title}** - ₹${s.pricePerNight.toLocaleString('en-IN')}/night (Host: ${s.host?.name || 'Local Host'}). [View Details](/listings/${s._id})`).join('\n') +
          `\n\nYou can book these stays directly through our platform and enjoy authentic Indian hospitality!`;
      } else {
        botReply = `I see you are interested in stays in **${matchedCity}**. Although we do not have listings registered in ${matchedCity} at this exact moment, you can discover other authentic heritage stays in nearby areas on our listings page.`;
      }
    } else if (query.includes('veg') || query.includes('food') || query.includes('jain')) {
      const stays = await Listing.find({
        $or: [
          { 'indianFilters.vegFoodNearby': true },
          { 'indianFilters.jainFoodNearby': true }
        ]
      }).limit(2);

      if (stays.length > 0) {
        botReply = `Indian vegetarian food is rich and delicious! We have properties with vegetarian/Jain food proximity indicators, such as:\n\n` +
          stays.map(s => `🏡 **${s.title}** in ${s.location.city} - offers easy access to pure vegetarian food. [View Details](/listings/${s._id})`).join('\n') +
          `\n\nYour host families are always happy to prepare native home-cooked meals according to your spice preferences!`;
      } else {
        botReply = "AapnaGhar listings prioritize regional culinary preferences. Many of our stays feature pure vegetarian home-cooked meals or have trusted traditional dhabas nearby.";
      }
    } else if (query.includes('safety') || query.includes('safe') || query.includes('women')) {
      const stays = await Listing.find({
        'safetyIndicators.womenFriendly': true
      }).sort({ 'safetyIndicators.safetyIndex': -1 }).limit(2);

      if (stays.length > 0) {
        botReply = `Safety is our highest priority at AapnaGhar. Stays with **Women-Friendly** ratings feature CCTV, well-lit neighborhoods, and background-verified hosts. Check out these highly-rated safe properties:\n\n` +
          stays.map(s => `🏡 **${s.title}** in ${s.location.city} (Safety Score: ${s.safetyIndicators.safetyIndex}/10). [View Details](/listings/${s._id})`).join('\n') +
          `\n\nWe recommend informing your hosts of your travel itinerary so they can assist you with safe transits.`;
      } else {
        botReply = "Every property on AapnaGhar goes through strict validation checks. Stays with the 'Women-Friendly' badge have verified host profiles and high neighborhood safety reviews.";
      }
    } else if (query.includes('budget') || query.includes('cheap') || query.includes('price')) {
      const stays = await Listing.find().sort({ pricePerNight: 1 }).limit(2);

      if (stays.length > 0) {
        botReply = `Looking for budget-friendly slow travel? Here are some of our most economical verified homestays:\n\n` +
          stays.map(s => `🏡 **${s.title}** in ${s.location.city} - ₹${s.pricePerNight.toLocaleString('en-IN')}/night. [View Details](/listings/${s._id})`).join('\n') +
          `\n\nYou can also filter searches by your specific price range on the discovery page.`;
      } else {
        botReply = "Traveling on a budget in India is easy with AapnaGhar. You can find stays offering shared kitchen spaces to cook light meals and easy proximity to public rail/metro transits.";
      }
    } else {
      // General Greeting / Helper response
      const featured = await Listing.find().limit(2);
      botReply = `Namaste! I am **GharGyan AI**, your local travel advisor. I can help you search verified stays, understand Indian cultural etiquettes, check safety options, or plan your transit.\n\n`;
      if (featured.length > 0) {
        botReply += `Here are some popular stays to explore:\n` +
          featured.map(s => `• **${s.title}** in ${s.location.city} (₹${s.pricePerNight.toLocaleString('en-IN')}/night) [View Stays](/listings/${s._id})`).join('\n');
      }
    }

    res.status(200).json({
      success: true,
      source: 'Database Connected Local Advisor',
      message: botReply
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Predict custom travel budget costs
// @route   POST /api/ai/predict-cost
// @access  Public
const predictTravelCost = async (req, res, next) => {
  try {
    const { city, days, travelers, comfortClass, season } = req.body;

    if (!city) {
      res.status(400);
      return next(new Error('City parameter is required'));
    }

    const duration = Math.max(Number(days) || 1, 1);
    const size = Math.max(Number(travelers) || 1, 1);
    const comfort = comfortClass || 'mid-range';
    const timeOfYear = season || 'mid';

    const costResult = calculateCostMath(city.toLowerCase().trim(), duration, size, comfort, timeOfYear);

    res.status(200).json({
      success: true,
      data: {
        city,
        days: duration,
        travelers: size,
        comfortClass: comfort,
        season: timeOfYear,
        estimatedTotal: costResult.totalCost,
        breakdown: costResult.breakdown
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateItinerary,
  chatWithAssistant,
  predictTravelCost
};
