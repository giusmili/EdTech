'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send, Compass } from 'lucide-react';

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
  'Comment commencer ?',
  'À quoi servent les onglets ?',
  'Comment réviser efficacement ?',
  'Que faire après une leçon ?',
];

const CHATBOT_WELCOME_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: "Bonjour. Je suis le guide de l'application. Pose-moi une question ou utilise un raccourci ci-dessous pour comprendre comment avancer.",
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 120);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
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
        { id: `assistant-${Date.now() + 1}`, role: 'assistant', content: assistantReply },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Le chatbot n'a pas pu répondre pour le moment.";
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
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(18, 18, 18, 0.48)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fade-in 0.2s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="chatbot-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Assistant — Mode d'emploi"
        style={{
          width: '100%',
          maxWidth: '680px',
          height: 'min(88vh, 740px)',
          background: '#f0feff',
          border: '1px solid #c1e9e0',
          boxShadow: '0 32px 80px rgba(18, 18, 18, 0.22)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatbot-enter 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #c1e9e0',
            flexShrink: 0,
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#e94e33',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Assistant étudiant
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.4rem, 4vw, 1.75rem)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Compass size={22} strokeWidth={1.8} style={{ color: '#e94e33', flexShrink: 0 }} />
              Mode d'emploi
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'assistant"
            className="chatbot-close-btn"
            style={{
              width: '40px',
              height: '40px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              border: '1px solid #c1e9e0',
              borderRadius: '4px',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </header>

        {/* Quick actions */}
        <div
          className="chatbot-quick-actions-wrap"
          style={{
            padding: '1rem 1.75rem',
            borderBottom: '1px solid #c1e9e0',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {CHATBOT_QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                disabled={isLoading}
                onClick={() => sendMessage(action)}
                className="chatbot-quick-action"
                style={{
                  padding: '0.55rem 0.9rem',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  opacity: isLoading ? 0.4 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div
          className="chatbot-messages"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem 1.75rem',
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
                maxWidth: '80%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  opacity: 0.38,
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  paddingInline: '0.25rem',
                }}
              >
                {message.role === 'user' ? 'Vous' : 'Guide'}
              </span>
              <div
                style={{
                  background: message.role === 'user' ? '#121212' : '#ffffff',
                  color: message.role === 'user' ? '#ffffff' : '#121212',
                  border: `1px solid ${message.role === 'user' ? '#121212' : '#c1e9e0'}`,
                  padding: '0.875rem 1.125rem',
                  borderRadius:
                    message.role === 'user'
                      ? '10px 10px 2px 10px'
                      : '10px 10px 10px 2px',
                }}
              >
                <p style={{ fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>
                  {renderSimpleMarkdown(message.content)}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  opacity: 0.38,
                  paddingInline: '0.25rem',
                }}
              >
                Guide
              </span>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #c1e9e0',
                  padding: '1rem 1.25rem',
                  borderRadius: '10px 10px 10px 2px',
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                }}
              >
                <span className="chatbot-dot" />
                <span className="chatbot-dot" style={{ animationDelay: '0.16s' }} />
                <span className="chatbot-dot" style={{ animationDelay: '0.32s' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input footer */}
        <div
          style={{
            padding: '1rem 1.75rem 1.25rem',
            borderTop: '1px solid #c1e9e0',
            background: 'rgba(255,255,255,0.6)',
            flexShrink: 0,
          }}
        >
          {error && (
            <p
              style={{
                fontSize: '11px',
                color: '#e94e33',
                fontFamily: 'var(--font-mono)',
                marginBottom: '0.75rem',
                margin: '0 0 0.75rem',
              }}
            >
              {error}
            </p>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await sendMessage(input);
            }}
            style={{ display: 'flex', gap: '0.625rem' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pose ta question…"
              className="chatbot-input"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '0.875rem 1.125rem',
                background: '#fff',
                border: '1px solid #c1e9e0',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-primary chatbot-send-btn"
              style={{
                padding: '0.875rem 1.25rem',
                opacity: isLoading || !input.trim() ? 0.42 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexShrink: 0,
              }}
            >
              <Send size={14} />
              <span>Envoyer</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
