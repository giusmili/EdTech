'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

const renderSimpleMarkdown = (content: string) => {
  return content.split('\n').map((line, lineIndex) => {
    const segments = line.split(/(\*\*.*?\*\*)/g);

    return (
      <span key={`line-${lineIndex}`}>
        {segments.map((segment, segmentIndex) => {
          const isBold = segment.startsWith('**') && segment.endsWith('**') && segment.length >= 4;

          if (isBold) {
            return <strong key={`segment-${lineIndex}-${segmentIndex}`}>{segment.slice(2, -2)}</strong>;
          }

          return <span key={`segment-${lineIndex}-${segmentIndex}`}>{segment}</span>;
        })}
        {lineIndex < content.split('\n').length - 1 && <br />}
      </span>
    );
  });
};

const CHATBOT_QUICK_ACTIONS = [
  'Comment commencer mon parcours ?',
  'À quoi servent les onglets ?',
  'Comment réviser efficacement ?',
  'Que faire après une leçon ?',
];

const CHATBOT_WELCOME_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: "Bonjour. Je suis le guide de l'application. Je peux t'expliquer rapidement comment avancer sans te perdre.",
  },
  {
    id: 'welcome-2',
    role: 'assistant',
    content: "Commence par le Dashboard, définis ton objectif dans Parcours, puis suis les activités proposées. Tu peux aussi me poser une question précise.",
  },
];

const buildChatbotReply = (prompt: string) => {
  const normalized = prompt.toLowerCase();

  if (normalized.includes('commencer') || normalized.includes('début') || normalized.includes('debut')) {
    return "Pour bien commencer : 1. ouvre le Dashboard, 2. clique sur le bouton qui te mène au parcours, 3. définis ton objectif, 4. lance la première activité disponible dans la timeline.";
  }

  if (normalized.includes('onglet') || normalized.includes('dashboard') || normalized.includes('carte') || normalized.includes('parcours') || normalized.includes('jeux') || normalized.includes('neural')) {
    return "Les onglets ont chacun un rôle : Dashboard pour la vue d'ensemble, Carte pour naviguer, Parcours pour suivre la timeline, Neural pour les révisions, Jeux pour t'entraîner de façon active.";
  }

  if (normalized.includes('révision') || normalized.includes('revision') || normalized.includes('mémoire') || normalized.includes('memoire') || normalized.includes('neural')) {
    return "L'espace Neural sert à revoir au bon moment les notions déjà vues. Quand une carte est due, fais la séance tout de suite : c'est ce qui aide le plus la mémorisation.";
  }

  if (normalized.includes('leçon') || normalized.includes('lecon') || normalized.includes('cours') || normalized.includes('activité') || normalized.includes('activite')) {
    return "Après une leçon, marque-la comme terminée pour débloquer l'étape suivante. Ensuite, enchaîne soit avec un exercice, soit avec une courte révision pour consolider.";
  }

  if (normalized.includes('objectif') || normalized.includes('parcours')) {
    return "Ton objectif pilote toute l'application. Formule-le de manière concrète, puis laisse la timeline te guider étape par étape. Si tu changes de priorité, ajuste simplement le parcours.";
  }

  if (normalized.includes('quitter') || normalized.includes('déconnexion') || normalized.includes('deconnexion') || normalized.includes('compte')) {
    return "Tu peux quitter l'application via le bouton de sortie en haut à droite. Ta progression reste sauvegardée localement sur cet appareil.";
  }

  return "Je peux t'aider sur le parcours, les onglets, les révisions, les jeux ou la progression. Pose-moi une question simple, par exemple : comment démarrer ou comment réviser.";
};

export default function StudentHelpChatbotModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(CHATBOT_WELCOME_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setMessages(CHATBOT_WELCOME_MESSAGES);
      setInput('');
      setIsLoading(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Impossible de contacter le chatbot.');
      }

      const assistantReply =
        typeof data?.message === 'string' && data.message.trim()
          ? data.message.trim()
          : buildChatbotReply(trimmed);

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now() + 1}`,
          role: 'assistant',
          content: assistantReply,
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Le chatbot n'a pas pu répondre pour le moment.";

      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-fallback-${Date.now() + 1}`,
          role: 'assistant',
          content: `${buildChatbotReply(trimmed)}\n\nNote : réponse locale affichée car l'API est indisponible.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(18, 18, 18, 0.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="chatbot-modal"
        style={{
          width: '100%',
          maxWidth: '760px',
          maxHeight: 'min(88vh, 860px)',
          background: '#f0feff',
          border: '1px solid #c1e9e0',
          boxShadow: '0 30px 60px rgba(18, 18, 18, 0.18)',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div className="absolute top-0 right-0 p-12 text-[120px] font-sans font-black text-black/[0.03] select-none leading-none rotate-90 origin-top-right translate-y-24">
          GUIDE
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <header
            className="border-b border-black/10 px-10 py-6"
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}
          >
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.3em]">Assistant étudiant</p>
              <h2 className="text-5xl font-sans font-black leading-none">Mode d'emploi</h2>
              <p className="text-sm opacity-40 font-sans italic">Pose une question ou utilise un raccourci pour comprendre l'application.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer l'assistant"
              className="bg-white border border-black/10"
              style={{ width: '44px', height: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} />
            </button>
          </header>

          <div className="px-10 py-6 border-b border-black/10">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {CHATBOT_QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={isLoading}
                  onClick={() => sendMessage(action)}
                  className="bg-white border border-black/10 text-[10px] uppercase font-bold tracking-widest"
                  style={{ padding: '0.85rem 1rem', opacity: isLoading ? 0.45 : 1 }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div
            className="chatbot-messages"
            style={{
              padding: '1.5rem 2.5rem',
              overflowY: 'auto',
              maxHeight: '42vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: message.role === 'user' ? '#121212' : '#ffffff',
                  color: message.role === 'user' ? '#ffffff' : '#121212',
                  border: message.role === 'user' ? '1px solid #121212' : '1px solid #c1e9e0',
                  padding: '1rem 1.1rem',
                  borderRadius: '8px',
                }}
              >
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40" style={{ marginBottom: '0.6rem' }}>
                  {message.role === 'user' ? 'Vous' : 'Assistant'}
                </p>
                <p className="text-sm leading-relaxed">{renderSimpleMarkdown(message.content)}</p>
              </div>
            ))}
            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '85%',
                  background: '#ffffff',
                  color: '#121212',
                  border: '1px solid #c1e9e0',
                  padding: '1rem 1.1rem',
                  borderRadius: '8px',
                }}
              >
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40" style={{ marginBottom: '0.6rem' }}>
                  Assistant
                </p>
                <p className="text-sm leading-relaxed">Je prépare une réponse…</p>
              </div>
            )}
          </div>

          <div className="px-10 py-6 border-t border-black/10" style={{ background: 'rgba(255,255,255,0.55)' }}>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await sendMessage(input);
              }}
              className="space-y-4"
            >
              <label className="block text-[10px] uppercase font-bold tracking-widest opacity-50">Votre question</label>
              {error && <p className="text-xs text-lgc-orange font-mono">{error}</p>}
              <div className="chatbot-form-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
                <input
                  type="text"
                  value={input}
                  disabled={isLoading}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ex : comment suivre mon parcours ?"
                  className="bg-white border border-black/10 p-4 font-sans text-sm outline-none focus:border-lgc-orange"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button type="submit" disabled={isLoading} className="btn-primary" style={{ minWidth: '170px', opacity: isLoading ? 0.6 : 1 }}>
                  {isLoading ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
