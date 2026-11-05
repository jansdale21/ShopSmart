import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';

import {
  buildAssistantResponse,
  buildVerifiedAssistantResponse,
  detectQuestionIntent,
  rankProducts
} from '../services/assistant.js';

import { generateGeminiDraft } from '../services/gemini.js';
import { assistantQuestionSchema } from '../validators/schemas.js';

const router = Router();

const assistantLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

router.post('/questions', assistantLimiter, async (request, response, next) => {
  try {
    // Step 1: Validate the customer question.
    const parsed = assistantQuestionSchema.safeParse(request.body);

    if (!parsed.success) {
      return response.status(422).json({
        error: {
          code: 'INVALID_QUESTION',
          message: 'Question must contain between 3 and 300 characters.'
        }
      });
    }

    const question = parsed.data.question;

    // Step 2: Retrieve only public fields from active, in-stock products.
    const products = await prisma.product.findMany({
      where: {
        active: true,
        stock: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        stock: true
      },
      orderBy: {
        price: 'asc'
      }
    });

    // Step 3: Find products relevant to the question and budget.
    const selectedProducts = rankProducts(products, question)
      .filter((product) => product.score > 0)
      .slice(0, 3);

    const intent = detectQuestionIntent(question);

    // Normal catalog-based answer without a fallback warning.
    const fallback = buildAssistantResponse(
      selectedProducts,
      question
    );

    // Step 4: No matching product.
    // Do not call Gemini unnecessarily.
    if (selectedProducts.length === 0) {
      return response.json(fallback);
    }

    // Step 5: Answer deterministic or unsupported questions directly.
    // Comparison: use actual database prices.
    // Escalation: refer unsupported policies to store staff.
    // Specification: show documented facts and acknowledge missing details.
    if (
      intent === 'comparison' ||
      intent === 'escalation' ||
      intent === 'specification'
    ) {
      return response.json(fallback);
    }

    // Step 6: Initial privacy safeguard.
    // This does not replace comprehensive privacy controls.
    const containsPrivateInfo =
      /[^\s@]+@[^\s@]+\.[^\s@]+/i.test(question) ||
      /\b(my|our)\s+(name|email|address|phone|order|password)\b/i.test(question) ||
      /\+?\d[\d\s()-]{8,}\d/.test(question);

    if (containsPrivateInfo) {
      return response.json(fallback);
    }

    // Step 7: Request a structured AI draft from Gemini.
    try {
      const draft = await generateGeminiDraft(
        question,
        selectedProducts
      );

      // Step 8: Validate AI-selected product IDs and catalog facts.
      const verified = buildVerifiedAssistantResponse(
        draft,
        selectedProducts,
        question
      );

      // Show only validated catalog information.
      if (verified) {
        return response.json(verified);
      }

      // Gemini responded, but its draft failed validation.
      console.warn(
        'Gemini draft failed validation. Using rule-based fallback.'
      );

      return response.json(
        buildAssistantResponse(
          selectedProducts,
          question,
          'unverifiedDraft'
        )
      );

    } catch {
      // Handle provider errors, timeouts, and unavailable service.
      // Never expose the API key or provider error details to customers.
      console.warn(
        'Gemini unavailable. Using rule-based fallback.'
      );

      return response.json(
        buildAssistantResponse(
          selectedProducts,
          question,
          'providerFailure'
        )
      );
    }

  } catch (error) {
    next(error);
  }
});

export default router;