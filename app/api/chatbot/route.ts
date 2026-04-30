import { NextResponse } from 'next/server';

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

const CHATBOT_INSTRUCTIONS = `
Tu es l'assistant pédagogique de l'application La Grande Classe.
Ta mission est d'aider un étudiant à comprendre comment utiliser l'application.
Réponds toujours en français.
Sois concret, court, rassurant et orienté usage produit.
Ne réponds pas comme un support technique généraliste : réponds comme un guide embarqué dans l'application.

Contexte produit à connaître :
- L'application sert à guider un étudiant dans un parcours d'apprentissage.
- Après connexion, l'étudiant voit une barre de navigation avec : Dashboard, Carte, Parcours, Neural, Jeux.
- Dashboard : vue d'ensemble, progression, série, objectif en cours, point d'entrée principal.
- Carte : vue de navigation entre les modules.
- Parcours : timeline des étapes de travail, avec objectif, étapes à faire, étapes verrouillées et étapes terminées.
- Définir un objectif : l'étudiant formule ce qu'il veut réussir, puis l'application construit son parcours.
- Leçon / cours : permet de lire le contenu pédagogique puis de marquer la leçon comme terminée.
- Jeux : entraînement actif sous forme de quiz.
- Neural : révisions par répétition espacée pour revoir au bon moment les notions déjà étudiées.

Flux conseillé à expliquer quand c'est pertinent :
1. Commencer sur le Dashboard.
2. Définir un objectif si aucun objectif n'est encore actif.
3. Ouvrir le Parcours pour suivre la timeline.
4. Lancer la première activité disponible.
5. Marquer la leçon comme terminée pour débloquer la suite.
6. Utiliser Jeux et Neural pour s'entraîner et réviser.

Règles de réponse :
- Donne des réponses courtes, utiles et directement actionnables.
- Quand l'étudiant demande "comment faire", donne des étapes simples.
- Quand il demande à quoi sert un écran, explique sa fonction dans l'usage global.
- Si une information exacte n'existe pas dans le produit décrit ci-dessus, ne l'invente pas.
- Si l'utilisateur demande autre chose que l'usage de l'application, ramène poliment la réponse vers l'aide produit.
- Ne prétends pas avoir accès à des données privées, au vrai compte de l'étudiant, ni à un historique caché.
- Si une question est vague, suppose qu'il veut savoir quoi cliquer ensuite pour avancer.
`;

const extractOutputText = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return '';

  const maybePayload = payload as {
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string; refusal?: string }>;
    }>;
  };

  const chunks: string[] = [];

  for (const item of maybePayload.output ?? []) {
    if (item.type !== 'message') continue;

    for (const part of item.content ?? []) {
      if (part.type === 'output_text' && typeof part.text === 'string') {
        chunks.push(part.text);
      }

      if (part.type === 'refusal' && typeof part.refusal === 'string') {
        chunks.push(part.refusal);
      }
    }
  }

  return chunks.join('\n').trim();
};

const extractChatCompletionText = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return '';

  const maybePayload = payload as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  return maybePayload.choices?.[0]?.message?.content?.trim() ?? '';
};

export async function POST(request: Request) {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const compatibleApiKey = process.env.AI_API_KEY;
  const compatibleApiUrl = process.env.AI_API_URL;

  if (!openAiApiKey && !(compatibleApiKey && compatibleApiUrl)) {
    return NextResponse.json(
      { error: "Aucune configuration d'API n'est disponible côté serveur." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const sanitizedMessages = messages
      .filter(
        (message): message is ChatMessage =>
          !!message &&
          (message.role === 'assistant' || message.role === 'user') &&
          typeof message.content === 'string' &&
          message.content.trim().length > 0
      )
      .slice(-12);

    if (sanitizedMessages.length === 0) {
      return NextResponse.json(
        { error: 'Aucun message valide à transmettre au chatbot.' },
        { status: 400 }
      );
    }

    if (openAiApiKey) {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-5',
          instructions: CHATBOT_INSTRUCTIONS,
          input: sanitizedMessages.map((message) => ({
            role: message.role,
            content: [
              {
                type: 'input_text',
                text: message.content,
              },
            ],
          })),
        }),
      });

      const payload = (await response.json()) as {
        error?: { message?: string };
        id?: string;
      };

      if (!response.ok) {
        return NextResponse.json(
          {
            error:
              payload?.error?.message ||
              "L'API OpenAI a renvoyé une erreur.",
          },
          { status: response.status }
        );
      }

      const message = extractOutputText(payload);

      if (!message) {
        return NextResponse.json(
          { error: "L'API OpenAI n'a pas renvoyé de texte exploitable." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        message,
        responseId: payload.id ?? null,
        provider: 'openai',
      });
    }

    const response = await fetch(compatibleApiUrl as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${compatibleApiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: CHATBOT_INSTRUCTIONS.trim(),
          },
          ...sanitizedMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      }),
    });

    const payload = (await response.json()) as {
      error?: { message?: string };
      id?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            payload?.error?.message ||
            "L'API compatible a renvoyé une erreur.",
        },
        { status: response.status }
      );
    }

    const message = extractChatCompletionText(payload);

    if (!message) {
      return NextResponse.json(
        { error: "L'API compatible n'a pas renvoyé de texte exploitable." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message,
      responseId: payload.id ?? null,
      provider: 'compatible',
    });
  } catch (error) {
    console.error('Erreur chatbot OpenAI:', error);

    return NextResponse.json(
      { error: 'Impossible de joindre le service OpenAI pour le moment.' },
      { status: 500 }
    );
  }
}
