export const meals = [
  {
    name: "Lumpiang Shanghai",
    emoji: "🥟",
    type: "budget",
    message: "Perfect for tipid days.",
    image: "/baon/LumpiangShanghai.png",
    tags: [],
    recipe: {
      ingredients: [
        "½ kg ground pork",
        "1 small carrot, grated",
        "1 onion, minced",
        "2 cloves garlic, minced",
        "1 egg",
        "salt & pepper to taste",
        "lumpia wrappers",
        "oil for frying"
      ],
      steps: [
        "Mix ground pork, carrot, onion, garlic, egg, salt, and pepper in a bowl.",
        "Scoop 1 tbsp of mixture into lumpia wrapper and roll tightly.",
        "Seal the edges with water.",
        "Fry until golden brown and crispy.",
        "Serve with sweet chili sauce or ketchup."
      ],
      talaTip: "Make a big batch and freeze extra rolls for future cravings!"
    }
  },
  {
    name: "Adobo + Rice",
    emoji: "🍗",
    type: "classic",
    message: "Klasikong paborito ni tatay.",
    image: "/baon/AdoboRice.png",
    tags: [],
    recipe: {
      ingredients: [
        "½ kg chicken or pork",
        "1/4 cup soy sauce",
        "1/4 cup vinegar",
        "3 cloves garlic, crushed",
        "1 bay leaf",
        "peppercorns",
        "1/2 cup water",
        "rice, for serving"
      ],
      steps: [
        "In a pot, combine meat, soy sauce, garlic, bay leaf, and peppercorns.",
        "Marinate for 30 mins (optional).",
        "Add vinegar and water. Simmer without stirring.",
        "Once boiling, lower heat and simmer until meat is tender.",
        "Serve with warm rice."
      ],
      talaTip: "Let it rest after cooking—Adobo is better the next day!"
    }
  },
  {
    name: "Tuna Sandwich",
    emoji: "🥪",
    type: "quick",
    message: "Light, simple, and satisfying.",
    image: "/baon/TunaSandwich.png",
    tags: [],
    recipe: {
      ingredients: [
        "1 can tuna (in oil or water), drained",
        "2 tbsp mayonnaise",
        "salt & pepper to taste",
        "2 slices bread",
        "optional: lettuce, cheese, boiled egg"
      ],
      steps: [
        "In a bowl, mix tuna with mayo, salt, and pepper.",
        "Spread mixture on one slice of bread.",
        "Top with lettuce, cheese, or boiled egg if desired.",
        "Cover with second slice. Toast or eat as is."
      ],
      talaTip: "Try adding banana ketchup for a unique Pinoy twist!"
    }
  },
  {
    name: "Chicken Salad",
    emoji: "🥗",
    type: "healthy",
    message: "Para sa #balikalindog goals.",
    image: "/baon/ChickenSalad.png",
    tags: [],
    recipe: {
      ingredients: [
        "1 grilled chicken breast, sliced",
        "mixed greens (lettuce, arugula, etc.)",
        "cherry tomatoes, halved",
        "cucumber slices",
        "1 hard-boiled egg",
        "vinaigrette or dressing of choice"
      ],
      steps: [
        "Arrange greens on a plate or container.",
        "Top with chicken, tomatoes, cucumber, and egg.",
        "Drizzle with vinaigrette before eating."
      ],
      talaTip: "Use calamansi juice + olive oil + honey + salt for a DIY Pinoy dressing!"
    }
  },
  {
    name: "Pancit Canton",
    emoji: "🍜",
    type: "instant",
    message: "Walang kamatayang gabing tamad meal.",
    image: "/baon/PancitCanton.png",
    tags: [],
    recipe: {
      ingredients: [
        "1 pack instant pancit canton",
        "1 cup water",
        "optional: egg, leftover meat, veggies"
      ],
      steps: [
        "Boil noodles in water until soft. Drain.",
        "Mix noodles with included seasoning packets.",
        "Top with fried egg, leftover meat, or sautéed veggies if desired."
      ],
      talaTip: "Tala’s Hack: Add chopped garlic and a squeeze of calamansi for upgraded flavor!"
    }
  },
  {
    name: "Corned Beef + Rice",
    emoji: "🥩",
    type: "classic",
    message: "Panalo kahit breakfast o lunch.",
    image: "/baon/CornedBeefRice.png",
    tags: [],
    recipe: {
      ingredients: [
        "1 can corned beef",
        "1 small onion, sliced",
        "2 cloves garlic, minced",
        "cooking oil",
        "rice, for serving"
      ],
      steps: [
        "Heat oil in pan. Sauté garlic and onions.",
        "Add corned beef and stir-fry for 3–5 minutes.",
        "Serve hot with garlic rice or plain rice."
      ],
      talaTip: "Try it with sunny-side-up egg and suka for that carinderia-style combo!"
    }
  },

  // ---------------- New Meals ----------------

  {
    name: "Tocilog",
    emoji: "🍳",
    type: "silog",
    message: "Tocino + sinangag + itlog = love!",
    image: "/baon/Tocilog.png",
    tags: [],
    recipe: {
      ingredients: [
        "tocino slices",
        "garlic rice",
        "fried egg"
      ],
      steps: [
        "Fry tocino until caramelized.",
        "Serve with garlic rice and sunny-side-up egg."
      ],
      talaTip: "Add achara on the side for a tangy balance!"
    }
  },
  {
    name: "Longsilog",
    emoji: "🌭",
    type: "silog",
    message: "Sweet or garlicky? Your choice.",
    image: "/baon/Longsilog.jpg",
    tags: [],
    recipe: {
      ingredients: [
        "longganisa",
        "garlic rice",
        "fried egg"
      ],
      steps: [
        "Cook longganisa until browned.",
        "Plate with garlic rice and egg."
      ],
      talaTip: "Use vinegar dip with chopped garlic for contrast!"
    }
  },
  {
    name: "Bangsilog",
    emoji: "🐟",
    type: "silog",
    message: "Crunchy outside, soft inside.",
    image: "/baon/Bangsilog.jpg",
    tags: [],
    recipe: {
      ingredients: [
        "daing na bangus",
        "garlic rice",
        "fried egg"
      ],
      steps: [
        "Fry bangus until crispy.",
        "Serve with sinangag and egg."
      ],
      talaTip: "Pair with kamatis + suka dip for the win!"
    }
  },
  {
    name: "Spam Sandwich",
    emoji: "🥓",
    type: "quick",
    message: "Mabilisang baon, laging masarap.",
    image: "/baon/SpamSandwich.jpg",
    tags: [],
    recipe: {
      ingredients: [
        "Spam slices",
        "bread",
        "mayonnaise",
        "lettuce or cheese (optional)"
      ],
      steps: [
        "Pan-fry Spam slices.",
        "Spread mayo on bread and layer Spam.",
        "Add lettuce or cheese if desired."
      ],
      talaTip: "Toast the bread for extra texture!"
    }
  },
  {
    name: "Egg Salad Sandwich",
    emoji: "🥚",
    type: "quick",
    message: "Creamy, classic, and easy.",
    image: "/baon/EggSaladSandwich.jpeg",
    tags: [],
    recipe: {
      ingredients: [
        "2 hard-boiled eggs",
        "2 tbsp mayonnaise",
        "salt & pepper",
        "bread"
      ],
      steps: [
        "Mash eggs and mix with mayo, salt, and pepper.",
        "Spread on bread and enjoy."
      ],
      talaTip: "Add chopped pickles or relish for extra zing!"
    }
  },
  {
    name: "Bistek Tagalog",
    emoji: "🥩",
    type: "classic",
    message: "Sosy pero simple lutuin.",
    image: "/baon/BistekTagalog.png",
    tags: [],
    recipe: {
      ingredients: [
        "beef sirloin slices",
        "soy sauce",
        "calamansi juice",
        "onions",
        "garlic"
      ],
      steps: [
        "Marinate beef in soy sauce + calamansi.",
        "Sauté onions then beef until tender.",
        "Serve with rice and onion rings on top."
      ],
      talaTip: "Use red onions for a sweeter bite!"
    }
  },
  {
    name: "Giniling Guisado",
    emoji: "🥘",
    type: "budget",
    message: "Staple na ulam sa kahit anong bahay.",
    image: "/baon/Giniling.jpg",
    tags: [],
    recipe: {
      ingredients: [
        "ground pork or beef",
        "potatoes",
        "carrots",
        "raisins",
        "soy sauce"
      ],
      steps: [
        "Sauté garlic and onion, then meat.",
        "Add veggies and cook until soft.",
        "Season and serve with rice."
      ],
      talaTip: "Add hotdog slices for that fiesta-style feel!"
    }
  },
  {
    name: "Tortang Talong",
    emoji: "🍆",
    type: "healthy",
    message: "Paborito ni nanay!",
    image: "/baon/TortangTalong.png",
    tags: [],
    recipe: {
      ingredients: [
        "1 eggplant, grilled and peeled",
        "1 egg",
        "salt & pepper",
        "cooking oil"
      ],
      steps: [
        "Flatten grilled talong.",
        "Dip in beaten egg and fry.",
        "Serve with rice and ketchup or suka."
      ],
      talaTip: "Add ground meat or cheese for a hearty version!"
    }
  },
  {
    name: "Hotdog + Rice",
    emoji: "🌭",
    type: "instant",
    message: "Bata man o matanda, panalo.",
    image: "/baon/HotdogRice.jpg",
    tags: [],
    recipe: {
      ingredients: [
        "hotdogs",
        "rice",
        "ketchup"
      ],
      steps: [
        "Fry hotdogs until browned.",
        "Serve with rice and ketchup."
      ],
      talaTip: "Cut hotdogs into octopus shapes for kids!"
    }
  },
  {
    name: "Fried Tilapia",
    emoji: "🐟",
    type: "classic",
    message: "Lutong bahay feels.",
    image: "/baon/Tilapia.jpg",
    tags: [],
    recipe: {
      ingredients: [
        "1 tilapia, cleaned",
        "salt",
        "cooking oil"
      ],
      steps: [
        "Season fish with salt.",
        "Fry until golden and crispy.",
        "Serve with rice and suka dip."
      ],
      talaTip: "Score the fish for crispier skin!"
    }
  }
];