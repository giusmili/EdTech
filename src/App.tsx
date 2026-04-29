'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Map, BookOpen, Clock, Gamepad2, User, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { ModuleType, LearningStep, UserProgress, Flashcard } from './types';
import MoleculeBackground from './MoleculeBackground';

// Functional Initial State
const INITIAL_STEPS: LearningStep[] = [
  { id: '1', day: 'LUN', label: 'L\'Atome', time: '12 min', type: 'cours', moduleId: 'M5', status: 'pending' },
  { id: '2', day: 'MAR', label: 'Quiz Symboles', time: '10 min', type: 'exo', moduleId: 'M6', status: 'locked' },
  { id: '3', day: 'MER', label: 'Révision Énergie', time: '5 min', type: 'rev', moduleId: 'M3', status: 'locked' },
  { id: '4', day: 'JEU', label: 'Pause', time: '-', type: 'repos', moduleId: 'M4', status: 'locked' },
];

const STORAGE_DB_NAME = 'la-grande-classe';
const STORAGE_STORE_NAME = 'app-state';
const STORAGE_KEY = 'learning-state';

type PersistedState = {
  activeTab: ModuleType;
  progress: UserProgress;
  steps: LearningStep[];
  flashcards: Flashcard[];
};

const openAppDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = window.indexedDB.open(STORAGE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORAGE_STORE_NAME)) {
        database.createObjectStore(STORAGE_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const loadPersistedState = async (): Promise<PersistedState | null> => {
  if (typeof window === 'undefined' || !window.indexedDB) return null;

  const database = await openAppDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORAGE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORAGE_STORE_NAME);
    const request = store.get(STORAGE_KEY);

    request.onsuccess = () => resolve((request.result as PersistedState | undefined) ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
};

const persistState = async (state: PersistedState) => {
  if (typeof window === 'undefined' || !window.indexedDB) return;

  const database = await openAppDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORAGE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORAGE_STORE_NAME);

    store.put(state, STORAGE_KEY);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
};

const GoalSetting = ({ onComplete }: { onComplete: (goal: string) => void }) => {
  const [goal, setGoal] = useState('');
  return (
    <div className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="border-b border-black/10 pb-8">
        <p className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.3em]">AI Planner</p>
        <h1 className="text-5xl font-sans font-black tracking-tighter leading-none mt-2">Nouvel Objectif</h1>
      </header>
      
      <div className="space-y-6">
        <label className="block text-sm font-sans italic opacity-60">Qu'est-ce que tu veux réussir ?</label>
        <textarea 
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="ex: Maîtriser les équations du 2nd degré..."
          className="w-full bg-white border border-black/10 p-6 rounded-sm font-sans text-2xl min-h-[150px] outline-none focus:border-lgc-orange transition-colors"
        />
        <div className="flex flex-wrap gap-2">
          {['Réussir mon brevet', 'Rattraper en maths', 'Contrôle vendredi'].map(hint => (
            <button 
              key={hint} 
              onClick={() => setGoal(hint)}
              className="text-[9px] uppercase font-bold tracking-widest px-3 py-1 border border-black/10 rounded-full hover:bg-black hover:text-white transition-all"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-black text-white p-8 space-y-4">
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">L'IA prépare ton chemin</p>
        <p className="text-xs leading-relaxed opacity-70 italic font-sans">Elle repère les compétences à travailler et construit ton planning hebdo en accord avec tes priorités.</p>
      </div>

      <button 
        disabled={!goal.trim()}
        onClick={() => onComplete(goal)}
        className={`btn-primary w-full ${!goal.trim() && 'opacity-30'}`}
      >
        Construire mon parcours
      </button>
    </div>
  );
};

const Dashboard = ({ progress, activeGoal, onStartSession }: { progress: UserProgress, activeGoal: string | null, onStartSession: () => void }) => (
  <div className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
    <header className="flex justify-between items-end border-b border-black/10 pb-8">
      <div>
        <p className="text-lgc-orange font-bold text-[10px] uppercase tracking-[0.2em]">Tableau de Bord</p>
        <h1 className="text-6xl font-sans font-black mt-1 leading-none">Léa</h1>
      </div>
      <div className="w-12 h-12 border border-black/20 rounded-full flex items-center justify-center font-sans text-xl border-lgc-orange text-lgc-orange">L</div>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-7 bg-lgc-ink text-lgc-cream p-10 rounded-sm space-y-6 shadow-2xl relative overflow-hidden group min-h-[300px] flex flex-col justify-center">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Clock size={160} className="rotate-12" />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Objectif en cours</span>
          <h2 className="text-5xl font-sans mt-2 leading-tight">{activeGoal || "Aucun objectif"}</h2>
          {!activeGoal && <p className="mt-4 text-xs leading-relaxed opacity-70">Définis ton premier objectif pour commencer ton aventure.</p>}
        </div>
        <button 
          onClick={onStartSession}
          className="btn-primary w-fit mt-6 bg-white text-black hover:bg-lgc-orange hover:text-white"
        >
          {activeGoal ? 'Continuer le parcours' : 'Définir un objectif'}
        </button>
      </div>

      <div className="md:col-span-5 grid grid-cols-2 gap-8">
        <div className="bg-white border border-black/10 p-8 flex flex-col justify-center">
          <p className="text-[10px] text-lgc-orange uppercase font-bold tracking-widest">Série</p>
          <p className="text-4xl lg:text-6xl font-sans mt-1 italic tracking-tighter">{progress.streak}<span className="text-xl" style={{ marginLeft: '1px' }}>j</span></p>
          <p className="text-[10px] mt-2 font-mono opacity-40">Consistance</p>
        </div>
        <div className="bg-white border border-black/10 p-8 flex flex-col justify-center">
          <p className="text-[10px] text-lgc-orange uppercase font-bold tracking-widest">Progression</p>
          <p className="text-4xl lg:text-6xl font-sans mt-1 italic tracking-tighter">{progress.completedLessons.length}<span className="text-xl">/21</span></p>
          <div className="w-full h-1 bg-black/5 mt-4">
             <div className="h-full bg-black" style={{ width: `${(progress.completedLessons.length / 21) * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CourseReader = ({ onComplete }: { onComplete: () => void }) => {
  const [page, setPage] = useState(1);
  return (
    <div className="h-full flex flex-col p-10 space-y-10">
      <header className="flex justify-between items-center border-b border-black/10 pb-6">
        <h1 className="text-sm font-bold uppercase tracking-widest">Leçons / p.{page}</h1>
        <div className="w-2 h-2 bg-lgc-orange rounded-full animate-pulse"></div>
      </header>

      <motion.div 
        key={page}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col space-y-10"
      >
        <div>
          <span className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.3em]">Concept Physique</span>
          <h2 className="text-5xl font-sans font-black leading-none mt-2 tracking-tighter">L'Atome</h2>
          <p className="font-sans italic text-lg opacity-40 mt-1">Leucippe avait un drôle d'ami...</p>
        </div>
        
        <div className="text-sm leading-relaxed text-lgc-ink/70 space-y-6 flex-1">
          <p>Imagine la Grèce, il y a 2500 ans. Démocrite coupe un morceau de pain en deux. Puis en deux. Puis encore...</p>
          {page === 1 ? (
            <div className="aspect-[3/4] bg-white border border-black/5 relative overflow-hidden group">
               <img 
                 src="https://picsum.photos/seed/atom-greece/600/800?grayscale&blur=1" 
                 alt="Illustration conceptuelle de l'atome"
                 className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-lgc-orange/5 mix-blend-multiply"></div>
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white to-transparent">
                 <p className="text-[10px] text-lgc-ink uppercase tracking-widest font-bold">Concept: Fragmentation Infinie</p>
               </div>
            </div>
          ) : (
            <div className="bg-lgc-orange/5 p-6 border-l-4 border-lgc-orange">
              <p className="font-serif text-xl italic leading-tight">"Rien n'existe que les atomes et le vide ; tout le reste n'est qu'opinion."</p>
            </div>
          )}
          <p>L'atome est l'unité de base de toute matière.</p>
        </div>
      </motion.div>

      <div className="flex gap-4 pt-6 border-t border-black/10">
        {page < 2 ? (
          <button 
            onClick={() => setPage(page + 1)}
            className="flex-1 py-4 bg-black text-white text-[10px] uppercase font-bold tracking-[0.3em] hover:bg-lgc-orange transition-all"
          >
            Continuer
          </button>
        ) : (
          <button 
            onClick={onComplete}
            className="flex-1 py-4 bg-lgc-orange text-white text-[10px] uppercase font-bold tracking-[0.3em] active:scale-95 transition-all"
          >
            Marquer comme fini ✅
          </button>
        )}
      </div>
    </div>
  );
};

const SeriousGames = ({ onComplete }: { onComplete: () => void }) => {
  const [view, setView] = useState<'levels' | 'play' | 'result'>('levels');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const questions = [
    { 
      question: "Que signifie 'A-tomos' en grec ancien ?", 
      options: ["Petit pain", "Indivisible", "Nuage", "Énergie"], 
      correctAnswer: "Indivisible" 
    },
    { 
      question: "Qui a théorisé l'existence de l'atome en premier ?", 
      options: ["Einstein", "Newton", "Démocrite", "Marie Curie"], 
      correctAnswer: "Démocrite" 
    },
    { 
      question: "L'atome est principalement constitué de...", 
      options: ["Vide", "Béton", "Liquide", "Plomb"], 
      correctAnswer: "Vide" 
    }
  ];

  const handleAnswer = (answer: string) => {
    if (answer === questions[currentQuestion].correctAnswer) {
      setScore(prev => prev + 1);
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowHint(false);
    } else {
      setView('result');
    }
  };

  if (view === 'play') {
    return (
      <div className="p-10 space-y-12 animate-in fade-in zoom-in-95 duration-500">
        <header className="flex justify-between items-center border-b border-black/10 pb-6">
          <span className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.3em]">Simulation I</span>
          <span className="font-mono text-xs">{currentQuestion + 1} / {questions.length}</span>
        </header>

        <div className="space-y-8">
          <h2 className="text-4xl font-sans font-black tracking-tighter leading-tight">
            {questions[currentQuestion].question}
          </h2>
          
          <div className="aspect-video bg-white border border-black/5 flex items-center justify-center relative overflow-hidden group cursor-pointer" role="button" onClick={() => setShowHint(!showHint)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:16px_16px] opacity-5"></div>
            {showHint ? (
              <p className="text-xs font-serif italic text-lgc-orange p-8 text-center animate-in fade-in slide-in-from-bottom-2">
                "Pense à ce que Démocrite faisait avec son morceau de pain..."
              </p>
            ) : (
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-20 group-hover:opacity-100 transition-opacity">Tap for hint</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {questions[currentQuestion].options.map(opt => (
              <button 
                key={opt}
                onClick={() => handleAnswer(opt)}
                className="w-full py-5 px-8 border border-black/10 text-left font-sans text-lg hover:bg-black hover:text-white transition-all group flex justify-between items-center"
              >
                {opt}
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'result') {
    const stars = Math.ceil((score / questions.length) * 3);
    return (
      <div className="p-10 space-y-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="pt-20 space-y-4">
          <p className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.4em]">Simulation Terminée</p>
          <div className="flex justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: i < stars ? 1 : 0.5, rotate: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="text-4xl"
                style={{ color: i < stars ? '#f59e0b' : 'rgba(0,0,0,0.1)' }}
              >
                ★
              </motion.div>
            ))}
          </div>
          <h2 className="text-7xl font-sans font-black tracking-tighter">Excellent</h2>
        </div>

        <div className="grid grid-cols-2 border border-black/10 divide-x divide-black/10">
          <div className="py-8">
            <p className="text-[9px] uppercase font-bold tracking-widest opacity-40">Score</p>
            <p className="text-4xl font-sans italic">{score}/{questions.length}</p>
          </div>
          <div className="py-8">
            <p className="text-[9px] uppercase font-bold tracking-widest opacity-40">Badge</p>
            <p className="text-4xl font-sans italic">Atomiste</p>
          </div>
        </div>

        <button 
          onClick={() => {
            onComplete();
            setView('levels');
          }}
          className="btn-primary w-full"
        >
          Retour au programme
        </button>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-12">
      <header className="border-b border-black/10 pb-8">
        <p className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.3em]">Game Theory</p>
        <h1 className="text-6xl font-sans font-black tracking-tighter leading-none mt-1">Simulations</h1>
      </header>

      <div className="space-y-0 divide-y divide-black/10">
        {[
          { id: 'I', title: 'L\'Atome', sub: 'Conceptual baseline', stars: 3, status: 'completed' },
          { id: 'II', title: 'Symboles', sub: 'Interactive grid', stars: 1, status: 'active' },
          { id: 'III', title: 'Défi final', sub: 'System stress test', stars: 0, status: 'locked' }
        ].map((level) => (
          <div 
            key={level.id}
            className={`py-8 flex items-center gap-8 group transition-all cursor-pointer ${
              level.status === 'locked' ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <div className={`w-16 h-16 border flex items-center justify-center font-sans text-2xl transition-all ${
              level.status === 'active' ? 'bg-lgc-orange text-white border-lgc-orange' : 'bg-transparent border-black/10 text-black'
            }`}>
              {level.id}
            </div>
            <div className="flex-1">
              <h3 className="font-sans italic text-2xl leading-none">{level.title}</h3>
              <p className="text-[10px] text-lgc-orange uppercase font-bold mt-2 tracking-widest leading-none">{level.sub}</p>
              <div className="flex gap-2 mt-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`h-[1px] w-4 ${i < level.stars ? 'bg-black' : 'bg-black/10'}`} />
                ))}
              </div>
            </div>
            {level.status === 'active' && (
              <button onClick={() => setView('play')} className="btn-primary py-2 px-4 !text-[8px]">Launch</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Cartography = ({ onNavigate }: { onNavigate: (tab: ModuleType) => void }) => {
  const CX = 280, CY = 185;
  const R1 = 95, R2 = 155;
  const DEG = Math.PI / 180;
  const NR = 26;

  const nodes = [
    { id: 'M5' as ModuleType, label: "L'Atome",  sub: 'COURS',   time: 'T=12mn', angle: -45,  r: R1, active: true  },
    { id: 'M6' as ModuleType, label: 'Symboles',  sub: 'QUIZ',    time: 'T=10mn', angle: -135, r: R1, active: false },
    { id: 'M3' as ModuleType, label: 'Neural',    sub: 'MÉMOIRE', time: 'T=5mn',  angle:  45,  r: R2, active: false },
    { id: 'M2' as ModuleType, label: 'Dashboard', sub: 'HUB',     time: 'T=—',    angle: 135,  r: R2, active: false },
  ];

  return (
    <div className="h-full flex flex-col p-10 space-y-10">
      <header className="border-b border-black/10 pb-8">
        <p className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.3em]">Vue cartographique</p>
        <h1 className="text-6xl font-sans font-black tracking-tighter leading-none mt-1">Spatial Index</h1>
      </header>

      <div className="flex-1 bg-white border border-black/5 relative overflow-hidden">
        <MoleculeBackground color="#121212" n={45} fixed={false} />
        <p className="absolute top-4 left-6 text-[10px] uppercase font-black tracking-[0.4em] text-lgc-orange z-10">
          Touchez un nœud pour interagir
        </p>

        <svg viewBox="0 0 560 380" className="w-full h-full" style={{ minHeight: 280, position: 'relative', zIndex: 1 }}>
          <defs>
            <filter id="glow-node" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <pattern id="dotgrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="0.8" cy="0.8" r="0.65" fill="rgba(0,0,0,0.065)"/>
            </pattern>
          </defs>

          {/* Dot grid */}
          <rect width="560" height="380" fill="url(#dotgrid)"/>

          {/* Crosshair axes */}
          <line x1={CX} y1="15" x2={CX} y2="365" stroke="rgba(0,0,0,0.045)" strokeWidth="0.8"/>
          <line x1="15" y1={CY} x2="545" y2={CY} stroke="rgba(0,0,0,0.045)" strokeWidth="0.8"/>
          <text x={CX+4} y="24" fill="rgba(0,0,0,0.18)" fontSize="6.5" fontFamily="monospace">↑ Y</text>
          <text x="528" y={CY-3} fill="rgba(0,0,0,0.18)" fontSize="6.5" fontFamily="monospace">X →</text>

          {/* Orbit tick marks */}
          {[0,45,90,135,180,225,270,315].map(a => (
            <g key={a}>
              <line
                x1={CX+(R1-5)*Math.cos(a*DEG)} y1={CY+(R1-5)*Math.sin(a*DEG)}
                x2={CX+(R1+5)*Math.cos(a*DEG)} y2={CY+(R1+5)*Math.sin(a*DEG)}
                stroke="rgba(0,0,0,0.1)" strokeWidth="0.8"
              />
              <line
                x1={CX+(R2-5)*Math.cos(a*DEG)} y1={CY+(R2-5)*Math.sin(a*DEG)}
                x2={CX+(R2+5)*Math.cos(a*DEG)} y2={CY+(R2+5)*Math.sin(a*DEG)}
                stroke="rgba(0,0,0,0.07)" strokeWidth="0.8"
              />
            </g>
          ))}

          {/* Animated orbital rings */}
          <circle cx={CX} cy={CY} r={R1} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" strokeDasharray="5 8">
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="25s" repeatCount="indefinite"/>
          </circle>
          <circle cx={CX} cy={CY} r={R2} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="0.8" strokeDasharray="8 12">
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${CX} ${CY}`} to={`-360 ${CX} ${CY}`} dur="40s" repeatCount="indefinite"/>
          </circle>

          {/* Orbit radius labels */}
          <text x={CX+R1+4} y={CY-3} fill="rgba(0,0,0,0.2)" fontSize="6" fontFamily="monospace">r₁={R1}</text>
          <text x={CX+R2+4} y={CY-3} fill="rgba(0,0,0,0.15)" fontSize="6" fontFamily="monospace">r₂={R2}</text>

          {/* Connection lines */}
          {nodes.map(n => {
            const nx = CX + n.r * Math.cos(n.angle * DEG);
            const ny = CY + n.r * Math.sin(n.angle * DEG);
            return (
              <line key={`l-${n.id}`}
                x1={CX} y1={CY} x2={nx} y2={ny}
                stroke={n.active ? 'rgba(233,78,51,0.5)' : 'rgba(0,0,0,0.1)'}
                strokeWidth={n.active ? 0.9 : 0.7}
                strokeDasharray="3 5"
              />
            );
          })}

          {/* Nucleus pulsing ring */}
          <circle cx={CX} cy={CY} r="52" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1">
            <animate attributeName="r" values="50;62;50" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.25;0.03;0.25" dur="3s" repeatCount="indefinite"/>
          </circle>

          {/* Nucleus */}
          <circle cx={CX} cy={CY} r="42" fill="#111"/>
          <circle cx={CX} cy={CY} r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
          <circle cx={CX} cy={CY} r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" strokeDasharray="2 3"/>
          <text x={CX} y={CY-5} textAnchor="middle" fill="white" fontSize="7.5" fontWeight="900" letterSpacing="3" fontFamily="monospace">NOYAU</text>
          <text x={CX} y={CY+7} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="5.5" letterSpacing="2" fontFamily="monospace">CENTRAL</text>
          <text x={CX} y={CY+19} textAnchor="middle" fill="rgba(233,78,51,0.95)" fontSize="5.5" letterSpacing="1" fontFamily="monospace">∅{R1*2}u</text>

          {/* Satellite nodes */}
          {nodes.map((n, i) => {
            const nx = CX + n.r * Math.cos(n.angle * DEG);
            const ny = CY + n.r * Math.sin(n.angle * DEG);
            const isRight = Math.cos(n.angle * DEG) > 0;
            const lx = nx + (NR + 14) * Math.cos(n.angle * DEG);
            const ly = ny + (NR + 14) * Math.sin(n.angle * DEG);
            const anchor = isRight ? 'start' : 'end';

            return (
              <g key={n.id} onClick={() => onNavigate(n.id)} style={{ cursor: 'pointer' }}>
                {n.active && (
                  <circle cx={nx} cy={ny} r={NR+4} fill="rgba(233,78,51,0.1)">
                    <animate attributeName="r" values={`${NR+3};${NR+11};${NR+3}`} dur="2.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.2;0.04;0.2" dur="2.5s" repeatCount="indefinite"/>
                  </circle>
                )}
                <circle cx={nx} cy={ny} r={NR}
                  fill={n.active ? '#e94e33' : '#f5f2ed'}
                  stroke={n.active ? '#e94e33' : 'rgba(0,0,0,0.15)'}
                  strokeWidth="1"
                  filter={n.active ? 'url(#glow-node)' : undefined}
                />
                <circle cx={nx} cy={ny} r={NR-7}
                  fill="none"
                  stroke={n.active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)'}
                  strokeWidth="0.6" strokeDasharray="2 3"
                />
                <text x={nx} y={ny+1} textAnchor="middle" dominantBaseline="middle"
                  fill={n.active ? 'white' : '#121212'}
                  fontSize="9" fontWeight="900" letterSpacing="1" fontFamily="monospace"
                >
                  0{i+1}
                </text>
                <text x={lx} y={ly-4} textAnchor={anchor}
                  fill={n.active ? '#e94e33' : 'rgba(0,0,0,0.65)'}
                  fontSize="7.5" fontWeight="900" letterSpacing="1.5" fontFamily="monospace"
                >
                  {n.label.toUpperCase()}
                </text>
                <text x={lx} y={ly+7} textAnchor={anchor}
                  fill="rgba(0,0,0,0.32)" fontSize="5.5" letterSpacing="1" fontFamily="monospace"
                >
                  [{n.sub}] · {n.time}
                </text>
              </g>
            );
          })}

          {/* Corner metadata */}
          <text x="10" y="373" fill="rgba(0,0,0,0.15)" fontSize="6" fontFamily="monospace">LGC_MAP v2.1</text>
          <text x="455" y="373" fill="rgba(0,0,0,0.15)" fontSize="6" fontFamily="monospace">N=4 · Ω=2</text>
        </svg>
      </div>
    </div>
  );
};

// SM2 Algorithm
const calculateSM2 = (quality: number, prevInterval: number, prevRepetition: number, prevEfactor: number) => {
  let interval: number;
  let repetition: number;
  let efactor: number;

  if (quality >= 3) {
    if (prevRepetition === 0) {
      interval = 1;
    } else if (prevRepetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * prevEfactor);
    }
    repetition = prevRepetition + 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  efactor = prevEfactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (efactor < 1.3) efactor = 1.3;

  return { interval, repetition, efactor };
};

const SpacedRepetition = ({ cards, onReview }: { cards: Flashcard[], onReview: (id: string, quality: number) => void }) => {
  const [view, setView] = useState<'list' | 'review'>('list');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const dueCards = useMemo(() => cards.filter(c => c.nextReview <= Date.now()), [cards]);
  const scheduledCards = useMemo(() => cards.filter(c => c.nextReview > Date.now()), [cards]);

  const daysUntil = (ts: number) => {
    const d = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
    return d === 1 ? 'demain' : `dans ${d} j`;
  };

  if (view === 'review' && dueCards.length > 0) {
    const card = dueCards[currentIndex];
    return (
      <div className="p-10 space-y-12 animate-in fade-in duration-500">
        <header className="flex justify-between items-center border-b border-black/10 pb-8">
          <div>
            <p className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.3em]">Séance de rappel</p>
            <p className="text-xs opacity-40 mt-1 font-sans">Évalue ton souvenir pour chaque carte</p>
          </div>
          <span className="font-mono text-xs bg-black/5 px-3 py-1">{currentIndex + 1} / {dueCards.length}</span>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] perspective-1000">
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            className="w-full h-full relative preserve-3d cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`absolute inset-0 bg-white border border-black/10 p-12 flex flex-col items-center justify-center text-center backface-hidden ${isFlipped ? 'invisible' : 'visible'}`}>
              <p className="text-[10px] uppercase font-bold opacity-20 mb-8 tracking-widest">Question</p>
              <h2 className="text-3xl font-sans italic">{card.question}</h2>
              <p className="mt-12 text-[10px] uppercase font-bold tracking-widest opacity-40">— Cliquer pour révéler —</p>
            </div>
            <div className={`absolute inset-0 bg-black text-white border border-black/10 p-12 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 ${isFlipped ? 'visible' : 'invisible'}`}>
              <p className="text-[10px] uppercase font-bold opacity-40 mb-8 tracking-widest">Réponse</p>
              <h2 className="text-3xl font-sans">{card.answer}</h2>
              <p className="mt-10 text-[10px] uppercase font-bold tracking-widest opacity-30">Comment tu t'en es souvenu ?</p>
            </div>
          </motion.div>
        </div>

        {isFlipped && (
          <div className="space-y-3 animate-in slide-in-from-bottom-4">
            <p className="text-[9px] uppercase font-bold tracking-[0.3em] opacity-40 text-center">Évalue ton souvenir</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { q: 0, label: 'À revoir',  sub: 'Oublié',      color: 'bg-red-500'    },
                { q: 2, label: 'Difficile', sub: 'Hésitation',  color: 'bg-orange-400' },
                { q: 3, label: 'Bien',      sub: 'Retrouvé',    color: 'bg-green-500'  },
                { q: 5, label: 'Facile',    sub: 'Immédiat',    color: 'bg-blue-500'   },
              ].map(btn => (
                <button
                  key={btn.q}
                  onClick={() => {
                    onReview(card.id, btn.q);
                    setIsFlipped(false);
                    if (currentIndex < dueCards.length - 1) {
                      setCurrentIndex(prev => prev + 1);
                    } else {
                      setView('list');
                    }
                  }}
                  className={`${btn.color} text-white py-4 flex flex-col items-center gap-1`}
                >
                  <span className="text-[9px] uppercase font-bold tracking-widest">{btn.label}</span>
                  <span className="text-[7px] opacity-70">{btn.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-10 space-y-12">
      <header className="border-b border-black/10 pb-8">
        <p className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.3em]">Répétition Espacée</p>
        <h1 className="text-6xl font-sans font-black tracking-tighter leading-none mt-1">Séance de rappel</h1>
        <p className="text-xs font-sans italic opacity-40 mt-3">
          L'algorithme SM-2 programme chaque révision au moment idéal pour ancrer la mémoire à long terme.
        </p>
      </header>

      <div className="relative overflow-hidden group" style={{ height: '180px' }}>
        <img
          src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&h=360&q=70"
          alt="Étudiants en sciences"
          className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-lgc-cream to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end">
          <p className="text-[10px] uppercase font-bold tracking-widest text-lgc-orange">Ancrage mémoriel</p>
          <p className="text-[9px] font-mono opacity-40">SM-2 · Ebbinghaus curve</p>
        </div>
      </div>

      <div className="space-y-0 divide-y divide-black/5">
        {dueCards.length > 0 ? (
          <div className="py-10 bg-black text-white p-10 space-y-6">
            <div className="flex items-baseline gap-4">
              <h3 className="text-4xl font-sans italic">{dueCards.length} carte{dueCards.length > 1 ? 's' : ''} à rappeler</h3>
              <span className="text-[10px] uppercase font-bold opacity-30 tracking-widest">aujourd'hui</span>
            </div>
            <p className="text-xs opacity-60 leading-relaxed">
              Ces concepts sont au seuil de l'oubli. Une révision maintenant multiplie la durée de rétention.
            </p>
            <button onClick={() => { setCurrentIndex(0); setView('review'); }} className="btn-primary w-full bg-white text-black">
              Commencer la séance
            </button>
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <CheckCircle2 size={40} className="mx-auto opacity-10" />
            <h3 className="text-2xl font-sans italic opacity-30">Mémoire à jour</h3>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-20">Aucune révision due pour l'instant</p>
          </div>
        )}

        {scheduledCards.length > 0 && (
          <div className="pt-10 space-y-0 divide-y divide-black/5">
            <p className="text-[9px] uppercase font-bold tracking-[0.3em] opacity-40 pb-4">Prochaines révisions planifiées</p>
            {scheduledCards.map((item, i) => (
              <div key={i} className="py-6 flex items-center gap-6 opacity-50 hover:opacity-80 transition-opacity">
                <div className="flex-1">
                  <h3 className="font-sans text-lg font-black tracking-tight">{item.question}</h3>
                  <div className="flex gap-3 mt-2 items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-lgc-orange">{daysUntil(item.nextReview)}</span>
                    <span className="text-[9px] font-mono opacity-40">·</span>
                    <span className="text-[9px] font-mono opacity-40">Niveau {item.repetition}</span>
                    <div className="flex gap-0.5 ml-1">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className={`h-[3px] w-3 ${j < item.repetition ? 'bg-lgc-orange' : 'bg-black/10'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PersonalizedProgram = () => (
  <div className="p-10 space-y-12">
    <header className="flex justify-between items-end border-b border-black/10 pb-8">
       <div>
        <p className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.3em]">Trajectory</p>
        <h1 className="text-6xl font-sans font-black tracking-tighter leading-none mt-1">Timeline</h1>
      </div>
      <p className="text-[11px] font-bold opacity-30 text-right">W/04</p>
    </header>

    <div className="space-y-12">
      <section>
        <div className="flex justify-between items-baseline mb-6">
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Phase 01</span>
          <span className="font-sans italic text-sm">Active Objective</span>
        </div>
        <div className="space-y-0 divide-y divide-black/5">
          {[
            { day: 'MON', label: 'Équations (1)', time: '100%', type: 'cours' },
            { day: 'TUE', label: 'Exercise Block', time: '45%', type: 'exo' },
            { day: 'WED', label: 'Memory Scan', time: '0%', type: 'rev' },
            { day: 'THU', label: 'Rest Cycle', time: '-', type: 'repos' },
          ].map((item, i) => (
            <div key={i} className="py-6 group">
              <div className="flex justify-between items-baseline mb-2">
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-mono opacity-20">{item.day}</span>
                  <span className="font-sans italic text-xl group-hover:text-lgc-orange transition-colors">{item.label}</span>
                </div>
                <span className="text-[10px] font-mono">{item.time}</span>
              </div>
              <div className="h-[1px] w-full bg-black/5 relative overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: item.time }}
                  className="absolute inset-y-0 left-0 bg-black"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <button className="btn-primary w-full shadow-2xl">
        Adjust Trajectory
      </button>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<ModuleType>('M2');
  const [isHydrated, setIsHydrated] = useState(false);
  const [progress, setProgress] = useState<UserProgress>({
    streak: 12,
    scoreToday: 84,
    subjectsToReview: ['Ondes'],
    dailyGoalProgress: 0.6,
    completedLessons: [],
    activeGoal: null,
  });
  const [steps, setSteps] = useState<LearningStep[]>(INITIAL_STEPS);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { id: 'f1', question: 'Quelle est la charge du proton ?', answer: 'Positive (+)', interval: 0, repetition: 0, efactor: 2.5, nextReview: Date.now() },
    { id: 'f2', question: 'De quoi est composé le noyau atomique ?', answer: 'Protons et Neutrons', interval: 0, repetition: 0, efactor: 2.5, nextReview: Date.now() - 1000 },
  ]);

  useEffect(() => {
    let isMounted = true;

    const hydrateState = async () => {
      try {
        const savedState = await loadPersistedState();

        if (!isMounted || !savedState) {
          setIsHydrated(true);
          return;
        }

        setActiveTab(savedState.activeTab);
        setProgress(savedState.progress);
        setSteps(savedState.steps);
        setFlashcards(savedState.flashcards);
      } catch (error) {
        console.error('Impossible de charger le parcours depuis IndexedDB.', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrateState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const stateToPersist: PersistedState = {
      activeTab,
      progress,
      steps,
      flashcards,
    };

    persistState(stateToPersist).catch((error) => {
      console.error('Impossible de sauvegarder le parcours dans IndexedDB.', error);
    });
  }, [activeTab, flashcards, isHydrated, progress, steps]);

  const handleReview = (id: string, quality: number) => {
    setFlashcards(prev => prev.map(card => {
      if (card.id === id) {
        const { interval, repetition, efactor } = calculateSM2(quality, card.interval, card.repetition, card.efactor);
        return {
          ...card,
          interval,
          repetition,
          efactor,
          nextReview: Date.now() + interval * 24 * 60 * 60 * 1000
        };
      }
      return card;
    }));
  };

  const handleGoalComplete = (goal: string) => {
    setProgress(prev => ({ ...prev, activeGoal: goal }));
    setActiveTab('M4');
  };

  const handleLessonComplete = () => {
    const updatedLessons = [...progress.completedLessons, 'atome'];
    setProgress(prev => ({ ...prev, completedLessons: updatedLessons }));
    
    // Update steps
    const newSteps = steps.map(s => {
      if (s.id === '1') return { ...s, status: 'completed' as const };
      if (s.id === '2') return { ...s, status: 'pending' as const };
      return s;
    });
    setSteps(newSteps);
    setActiveTab('M4');
  };

  const navItems = [
    { id: 'M2', label: 'Dashboard', icon: Home },
    { id: 'M1', label: 'Carte', icon: Map },
    { id: 'M4', label: 'Parcours', icon: Clock },
    { id: 'M3', label: 'Neural', icon: BookOpen },
    { id: 'M6', label: 'Jeux', icon: Gamepad2 },
  ];

  const renderModule = () => {
    switch (activeTab) {
      case 'M2': return <Dashboard progress={progress} activeGoal={progress.activeGoal} onStartSession={() => setActiveTab(progress.activeGoal ? 'M4' : 'M4_GOAL')} />;
      case 'M1': return <Cartography onNavigate={setActiveTab} />;
      case 'M4_GOAL': return <GoalSetting onComplete={handleGoalComplete} />;
      case 'M4': return (
        <div className="p-10 space-y-12">
          <header className="flex justify-between items-end border-b border-black/10 pb-8">
            <div>
              <p className="text-[10px] font-bold text-lgc-orange uppercase tracking-[0.3em]">Trajectory</p>
              <h1 className="text-6xl font-sans font-black tracking-tighter leading-none mt-1">Timeline</h1>
            </div>
            <p className="text-[11px] font-bold opacity-30 text-right">W/04</p>
          </header>
          <div className="space-y-12">
            <section>
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Phase 01</span>
                <span className="font-sans italic text-sm">{progress.activeGoal || 'Set a goal first'}</span>
              </div>
              <div className="space-y-0 divide-y divide-black/5">
                {steps.map((item) => (
                  <div key={item.id} className={`py-6 group ${item.status === 'locked' ? 'opacity-30' : 'opacity-100'}`}>
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] font-mono opacity-20">{item.day}</span>
                        <button 
                          disabled={item.status === 'locked'}
                          onClick={() => setActiveTab(item.moduleId)}
                          className={`font-sans italic text-xl transition-colors text-left ${item.status === 'completed' ? 'line-through opacity-40' : 'group-hover:text-lgc-orange'}`}
                        >
                          {item.label}
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono">{item.time}</span>
                        {item.status === 'completed' && <CheckCircle2 size={12} className="text-green-500" />}
                        {item.status === 'pending' && <ChevronRight size={12} className="text-lgc-orange" />}
                      </div>
                    </div>
                    <div className="h-[1px] w-full bg-black/5 relative overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: item.status === 'completed' ? '100%' : item.status === 'pending' ? '15%' : '0%' }}
                        className="absolute inset-y-0 left-0 bg-black"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <button onClick={() => setActiveTab('M4_GOAL')} className="btn-primary w-full shadow-2xl">Adjust Trajectory</button>
          </div>
        </div>
      );
      case 'M5': return <CourseReader onComplete={handleLessonComplete} />;
      case 'M6': return <SeriousGames onComplete={handleLessonComplete} />;
      case 'M3': return <SpacedRepetition cards={flashcards} onReview={handleReview} />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full p-20 text-center space-y-4">
          <div className="w-1 h-1 bg-black rounded-full" />
          <h2 className="text-2xl font-sans italic opacity-30 mt-8 tracking-tighter">Drafting Phase...</h2>
          <button onClick={() => setActiveTab('M2')} className="text-xs uppercase font-black tracking-widest mt-4">Back Home</button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-lgc-cream max-w-5xl mx-auto relative shadow-2xl border-x border-black/5 overflow-hidden flex flex-col" style={{ backgroundColor: 'rgba(245, 242, 237, 0.88)' }}>
      {/* Editorial Watermark */}
      <div className="absolute top-0 right-0 p-12 text-[120px] font-sans font-black text-black/[0.03] select-none leading-none rotate-90 origin-top-right translate-y-24">
        MARCH
      </div>

      {/* Navigation Bar - Artistic Header nav */}
      <nav className="sticky top-0 left-0 right-0 bg-lgc-cream/80 backdrop-blur-md z-50 font-sans">
        <div className="max-w-5xl mx-auto grid grid-cols-5 h-20">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ModuleType)}
              className={`flex items-center justify-center gap-2 px-3 transition-all group relative ${
                activeTab === item.id ? 'text-lgc-orange' : 'text-black opacity-30 hover:opacity-100'
              }`}
            >
              <item.icon size={14} strokeWidth={3} className={activeTab === item.id ? 'animate-pulse' : 'opacity-40 group-hover:opacity-100'} />
              <span className={`text-[9px] uppercase tracking-widest font-black transition-all ${activeTab === item.id ? 'opacity-100' : 'opacity-0 lg:opacity-30 group-hover:opacity-100'}`}>
                {item.label}
              </span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTabMarker"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-lgc-orange"
                />
              )}
            </button>
          ))}
        </div>
      </nav>
      
      <main className="relative z-10 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {renderModule()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-black/10 px-10 py-6 mt-auto">
        <p className="text-[10px] uppercase tracking-[0.35em] font-black text-lgc-orange text-center">
          Edtech - LGC R&amp;D - 2026
        </p>
      </footer>
    </div>
  );
}
