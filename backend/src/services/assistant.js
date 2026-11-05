
const STOP_WORDS = new Set([
  'which', 'what', 'where', 'when', 'why', 'how',
  'would', 'should', 'could', 'can', 'do', 'does',
  'did', 'you', 'your', 'the', 'and', 'are', 'for',
  'with', 'from', 'this', 'that', 'have', 'has',
  'will', 'about', 'below', 'under', 'within', 'less',
  'than', 'up', 'to', 'at', 'most', 'maximum',
  'peso', 'pesos', 'php', 'price', 'budget',
  'recommend', 'recommended', 'recommendation',
  'suggest', 'suggestion', 'please', 'find', 'show',
  'want', 'need', 'looking', 'best', 'good',
  'product', 'products', 'item', 'items', 'available',
  'buy', 'purchase', 'cost', 'much', 'many', 'give',
  'tell', 'some', 'compare', 'comparison', 'versus',
  'cheaper', 'cheapest', 'expensive', 'difference',
  'between', 'better', 'warranty', 'warranties',
  'shipping', 'delivery', 'return', 'returns',
  'refund', 'refunds', 'year', 'years', 'feature',
  'features', 'stock', 'only', 'because', 'there',
  'any', 'something', 'maximum', 'max'
]);

function normalizeToken(token) {
  const irregular = {
    mice: 'mouse',
    accessories: 'accessory',
    batteries: 'battery',
    warranties: 'warranty'
  };

  if (irregular[token]) return irregular[token];

  if (token.endsWith('ies') && token.length > 4) {
    return token.slice(0, -3) + 'y';
  }

  if (
    /(ches|shes|xes|zes|sses)$/.test(token)
  ) {
    return token.slice(0, -2);
  }

  if (
    token.length > 4 &&
    token.endsWith('s') &&
    !token.endsWith('ss') &&
    !token.endsWith('us') &&
    !token.endsWith('is')
  ) {
    return token.slice(0, -1);
  }

  return token;
}

function tokenize(value) {
  return (String(value ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .map(normalizeToken);
}

function getSearchTerms(question) {
  return [...new Set(
    tokenize(question).filter((term) =>
      term.length > 2 &&
      !STOP_WORDS.has(term) &&
      !/^\d+$/.test(term)
    )
  )];
}

function formatPeso(value) {
  return `₱${Number(value).toLocaleString('en-PH', {
    maximumFractionDigits: 2
  })}`;
}

export function parseBudget(question) {
  const text = String(question ?? '').replace(/,/g, '');

  const currencyMatch = text.match(
    /(?:₱\s*|php\s*)(\d+(?:\.\d{1,2})?)/i
  );

  if (currencyMatch) {
    return Number(currencyMatch[1]);
  }

  const limitMatch = text.match(
    /\b(?:below|under|within|less\s+than|up\s+to|at\s+most|max(?:imum)?|budget(?:\s+of)?)\s+₱?\s*(\d+(?:\.\d{1,2})?)/i
  );

  if (limitMatch) {
    return Number(limitMatch[1]);
  }

  const pesoMatch = text.match(
    /\b(\d+(?:\.\d{1,2})?)\s*(?:pesos?|php)\b/i
  );

  return pesoMatch ? Number(pesoMatch[1]) : null;
}

// Identify the type of customer question.
export function detectQuestionIntent(question) {
  const text = question.toLowerCase();

  if (
    /\b(warranty|warranties|guarantee|refund|refunds|returns?|shipping|delivery)\b/.test(text) ||
    /\border status\b|\btrack(?:ing)?\s+(?:my\s+)?order\b/.test(text)
  ) {
    return 'escalation';
  }

  if (
    /\b(compare|comparison|versus|vs|cheaper|cheapest|expensive|difference)\b/.test(text) ||
    /\bbetter than\b/.test(text)
  ) {
    return 'comparison';
  }

  if (
    /\b(compatible|bluetooth|waterproof|dimensions?|specifications?|specs|battery|material|weight|size|color|colour|resolution|connectivity|switches|hot-swappable)\b/.test(text) ||
    /\bworks?\s+with\b/.test(text) ||
    /\b(?:does|do|can)\b.{0,50}\b(?:support|connect|pair)\b/.test(text)
  ) {
    return 'specification';
  }

  if (
    /\b(why|reason|recommend|recommendation|suggest|benefits?|suitable|worth)\b/.test(text)
  ) {
    return 'explanation';
  }

  return 'search';
}

// Retrieve only genuinely relevant products.
export function rankProducts(products, question) {
  const terms = getSearchTerms(question);
  const budget = parseBudget(question);
  const intent = detectQuestionIntent(question);

  if (terms.length === 0) {
    return [];
  }

  return products
    .filter((product) =>
      product.stock > 0 &&
      product.active !== false &&
      Number.isFinite(Number(product.price)) &&
      Number(product.price) >= 0 &&
      (budget === null || Number(product.price) <= budget)
    )
    .map((product) => {
      const nameTokens = tokenize(product.name);
      const categoryTokens = tokenize(product.category);
      const descriptionTokens = tokenize(product.description);

      const nameMatches = terms.filter(
        (term) => nameTokens.includes(term)
      );

      const categoryMatches = terms.filter(
        (term) => categoryTokens.includes(term)
      );

      const descriptionMatches = terms.filter(
        (term) => descriptionTokens.includes(term)
      );

      const hasPrimaryMatch =
        nameMatches.length > 0 ||
        categoryMatches.length > 0;

      // Description-only matching is allowed for:
      // 1. Specific technical questions.
      // 2. Queries where every requested term is present.
      const hasCompleteDescriptionMatch =
        terms.length >= 2 &&
        descriptionMatches.length === terms.length;

      const hasFeatureMatch =
        intent === 'specification' &&
        descriptionMatches.length > 0;

      if (
        !hasPrimaryMatch &&
        !hasCompleteDescriptionMatch &&
        !hasFeatureMatch
      ) {
        return null;
      }

      const score =
        nameMatches.length * 10 +
        categoryMatches.length * 6 +
        descriptionMatches.length * 2;

      return {
        ...product,
        score
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      b.score - a.score ||
      Number(a.price) - Number(b.price)
    );
}

// Keep the original API response structure.
function makeResponse(answer, products) {
  return {
    answer,
    recommendedProducts: products.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      category: product.category
    })),
    sources: products.map((product) => ({
      type: 'product',
      id: product.id,
      name: product.name
    }))
  };
}

function createCatalogResponse(products, question, fallbackReason = null) {
  const intent = detectQuestionIntent(question);
  const budget = parseBudget(question);

  if (intent === 'escalation') {
    return makeResponse(
      'I cannot verify warranty, shipping, returns, refunds, or order-status details from the available ShopSmart product records. Please confirm the specific policy or order details with store staff.',
      products
    );
  }

  if (products.length === 0) {
    if (getSearchTerms(question).length === 0) {
      return makeResponse(
        'Could you specify the product or category you are looking for? You can also share your budget so I can check the ShopSmart catalog.',
        []
      );
    }

    return makeResponse(
      'I could not find an in-stock product matching that request. You may try another product name or budget.',
      []
    );
  }

  let answer = '';

  if (intent === 'comparison') {
    const sorted = [...products].sort(
      (a, b) => Number(a.price) - Number(b.price)
    );

    if (sorted.length < 2) {
      answer =
        `I found ${sorted[0].name} at ${formatPeso(sorted[0].price)}, ` +
        'but I need at least two matching, available products to compare. Which other product would you like to compare?';
    } else {
      const details = sorted
        .map((product) =>
          `${product.name}: ${formatPeso(product.price)}`
        )
        .join('; ');

      answer =
        `According to the ShopSmart catalog, the matching products cost: ${details}. ` +
        `The cheapest is ${sorted[0].name} at ${formatPeso(sorted[0].price)}.`;
    }
  } else if (intent === 'specification') {
    const product = products[0];
    const description = String(product.description ?? '').trim();

    answer =
      `The ShopSmart catalog lists ${product.name} at ${formatPeso(product.price)}. `;

    if (description) {
      answer += `Its catalog description states: "${description}". `;
    }

    answer +=
      'I cannot confirm additional technical specifications that are not explicitly established by the catalog. Please verify any missing details with store staff.';
  } else if (intent === 'explanation') {
    const product = products[0];

    answer =
      `I recommend ${product.name} because it matches your product search, ` +
      `is currently in stock, and costs ${formatPeso(product.price)}`;

    if (budget !== null) {
      answer += `, which is within your ${formatPeso(budget)} budget`;
    }

    answer += '.';

    const description = String(product.description ?? '').trim();

    if (description) {
      answer += ` The ShopSmart catalog describes it as: "${description}".`;
    }
  } else {
    const details = products
      .map((product) =>
        `${product.name} (${formatPeso(product.price)})`
      )
      .join(', ');

    answer =
      `Based on the current ShopSmart catalog, the matching in-stock ` +
      `${products.length === 1 ? 'product is' : 'products are'}: ${details}.`;

    if (budget !== null) {
      answer += ` These options fit your ${formatPeso(budget)} budget.`;
    }
  }

  if (fallbackReason === 'providerFailure') {
    answer +=
      ' The AI service is temporarily unavailable. This answer uses current ShopSmart catalog information.';
  } else if (fallbackReason === 'unverifiedDraft') {
    answer +=
      ' The AI-generated answer could not be verified. This answer uses current ShopSmart catalog information.';
  }

  return makeResponse(answer, products);
}

// Safe rule-based response when Gemini is unavailable.
export function buildAssistantResponse(
  products,
  question,
  fallbackReason = null
) {
  const ranked = rankProducts(products, question).slice(0, 3);

  return createCatalogResponse(ranked, question, fallbackReason);
}

// Verify AI-selected IDs before using them in a response.
export function buildVerifiedAssistantResponse(
  draft,
  selectedProducts,
  question
) {
  if (
    !draft ||
    typeof draft.answerDraft !== 'string' ||
    !draft.answerDraft.trim() ||
    draft.answerDraft.length > 800 ||
    !Array.isArray(draft.recommendedProductIds) ||
    draft.recommendedProductIds.length === 0 ||
    draft.recommendedProductIds.length > 3
  ) {
    return null;
  }

  const eligibleProducts = rankProducts(
    selectedProducts,
    question
  );

  const productsById = new Map(
    eligibleProducts.map((product) => [
      product.id,
      product
    ])
  );

  const seenIds = new Set();
  const verifiedProducts = [];

  for (const id of draft.recommendedProductIds) {
    if (!Number.isSafeInteger(id) || seenIds.has(id)) {
      return null;
    }

    const product = productsById.get(id);

    if (!product) {
      return null;
    }

    seenIds.add(id);
    verifiedProducts.push(product);
  }

  // Never display unsupported raw AI claims.
  return createCatalogResponse(
    verifiedProducts,
    question
  );
}
