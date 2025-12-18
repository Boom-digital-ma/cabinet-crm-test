import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, 
  Calendar, 
  FileText, 
  Briefcase, 
  Bell, 
  Search, 
  Plus, 
  Brain, 
  Clock, 
  User, 
  ShieldAlert, 
  CheckCircle,
  TrendingUp,
  MapPin,
  Smartphone,
  Landmark,
  BookOpen,
  Gavel,
  AlertTriangle,
  Navigation,
  Printer,
  MessageSquare,
  Send,
  X,
  Mic,
  Sparkles
} from 'lucide-react';

// --- TYPES ---

interface AgendaItem {
  id: number;
  time: string;
  endTime: string;
  title: string;
  tribunal: string;
  type: string;
  status: string;
  urgent: boolean;
  prepared: boolean;
  notes?: string;
  ref: string;
}

interface Dossier {
  id: number;
  ref: string;
  client: string;
  adverse: string;
  tribunal: string;
  etape: string;
  date: string;
  type: string;
  urgent?: boolean;
}

interface AIAnalysis {
  summary: string;
  docType: string;
  confidenceScore: number;
  facts: string[];
  laws: { code: string; art: string; text: string }[];
  strategy: { step: number; action: string; desc: string; impact: string }[];
  jurisprudence: string;
}

interface Message {
  id: number;
  type: 'bot' | 'user';
  text: string;
}

// --- DONNÉES ENRICHIES ---

const MOCK_STATS = {
  audiences: 4,
  urgences: 2,
  facturation: "18,500 MAD"
};

const MOCK_AGENDA_DETAILED: AgendaItem[] = [
  { 
    id: 1, 
    time: "09:00", 
    endTime: "10:30",
    title: "Audience : Héritiers Z. c/ Consorts M.", 
    tribunal: "TPI Marrakech - Salle 2",
    type: "Audience", 
    status: "En cours", 
    urgent: true,
    prepared: true,
    notes: "Plaidoirie sur l'incident de procédure uniquement.",
    ref: "CAB-24/112"
  },
  { 
    id: 2, 
    time: "11:00", 
    endTime: "12:00",
    title: "Délibéré : Soc. Atlas vs X", 
    tribunal: "Cour d'Appel Marrakech",
    type: "Délibéré", 
    status: "À venir", 
    urgent: false,
    prepared: true,
    notes: "Récupérer la copie du jugement.",
    ref: "CAB-24/089"
  },
  { 
    id: 3, 
    time: "14:30", 
    endTime: "15:30",
    title: "Consultation : M. El Idrissi", 
    tribunal: "Cabinet",
    type: "RDV", 
    status: "Confirmé", 
    urgent: false,
    prepared: false,
    notes: "Première consultation - Apporter dossier foncier.",
    ref: "CLIENT-NEW"
  },
];

const MOCK_DOSSIERS: Dossier[] = [
  { id: 101, ref: "CAB-24/112", client: "Hôtel Palmeraie", adverse: "Tour Opérateur", tribunal: "TPI Marrakech", etape: "Expertise", date: "2024-12-12", type: "Commercial" },
  { id: 102, ref: "CAB-24/089", client: "Consorts Alami", adverse: "Conservation Foncière", tribunal: "Admin. Marrakech", etape: "Mise en état", date: "2024-12-08", type: "Foncier", urgent: true },
  { id: 103, ref: "CAB-23/450", client: "Mme. Tazi", adverse: "M. Tazi", tribunal: "Famille Marrakech", etape: "Conciliation", date: "2024-12-10", type: "Famille" },
];

const MOCK_AI_ANALYSIS_ENRICHED: AIAnalysis = {
  summary: "Le document analysé est un 'Mémoire en réponse' de la partie adverse concernant le litige foncier (Dossier Alami).",
  docType: "Mémoire en réponse",
  confidenceScore: 85,
  facts: [
    "La partie adverse conteste la qualité à agir des héritiers.",
    "Citation d'un plan cadastral datant de 1998 (potentiellement obsolète).",
    "Absence de preuve de notification officielle."
  ],
  laws: [
    { code: "Code Droits Réels", art: "Art. 3", text: "L'immatriculation foncière purge le bien de tout droit antérieur non inscrit." },
    { code: "Code Procédure Civile", art: "Art. 39", text: "La notification doit être faite à personne ou à domicile élu." }
  ],
  strategy: [
    { step: 1, action: "Soulever la nullité de notification", desc: "La notification n'a pas touché tous les héritiers (mineurs).", impact: "High" },
    { step: 2, action: "Demander Contre-Expertise", desc: "Le plan de 1998 ne reflète pas l'état actuel (constructions nouvelles).", impact: "Medium" },
    { step: 3, action: "Plaider l'irrecevabilité", desc: "Sur la base de l'article 3 du Code des Droits Réels.", impact: "High" }
  ],
  jurisprudence: "Arrêt Cour de Cassation n°450/2020 (Ch. Fonc.) : Confirme la nullité absolue en cas de défaut de notification aux tuteurs des mineurs."
};

// --- COMPOSANTS UI ---

const Badge = ({ children, type }: { children?: React.ReactNode; type: 'urgent' | 'normal' | 'success' | 'warning' | string }) => {
  const styles: Record<string, string> = {
    urgent: "bg-red-50 text-red-700 border-red-100",
    normal: "bg-indigo-50 text-indigo-700 border-indigo-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100"
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${styles[type] || styles.normal}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = "", onClick }: { children?: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- NOUVEAU COMPOSANT : CHAT ASSISTANT ---

const ChatAssistant = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'bot', text: "Bonjour Me. Abousaid. Je suis votre assistant juridique. Voulez-vous un résumé de votre journée ou préparer un dossier spécifique ?" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const finalInput = textToSend || input;
    if (!finalInput.trim()) return;

    // User message
    const newMessages = [...messages, { id: Date.now(), type: 'user' as const, text: finalInput }];
    setMessages(newMessages);
    
    const userInputLower = finalInput.toLowerCase();
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      let responseText = "Je n'ai pas compris. Essayez 'Agenda' ou 'Dossier Alami'.";
      
      if (userInputLower.includes('bonjour') || userInputLower.includes('salut')) {
        responseText = "Bonjour Maître ! Prêt pour vos audiences ?";
      } else if (userInputLower.includes('agenda') || userInputLower.includes('programme') || userInputLower.includes('demain') || userInputLower.includes('aujourd\'hui')) {
        responseText = `Vous avez ${MOCK_AGENDA_DETAILED.length} événements aujourd'hui. Le plus urgent est l'audience "Héritiers Z." à 09:00 au TPI.`;
      } else if (userInputLower.includes('dossier') || userInputLower.includes('affaire')) {
        responseText = "Quel dossier souhaitez-vous consulter ? J'ai récemment mis à jour 'Hôtel Palmeraie' et 'Consorts Alami'.";
      } else if (userInputLower.includes('alami')) {
        responseText = "Le dossier 'Consorts Alami' (CAB-24/089) est en mise en état au Tribunal Administratif. Une alerte J-7 est active pour le mémoire en réplique.";
      } else if (userInputLower.includes('merci')) {
        responseText = "Je vous en prie, Maître.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: responseText }]);
    }, 1000);
  };

  const suggestions = ["Mon agenda", "Dossier Alami", "Alertes urgentes"];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white rounded-t-2xl flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500 rounded-lg">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Assistant Juridique</h3>
            <p className="text-[10px] text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> En ligne
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.type === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length < 3 && (
        <div className="px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto">
          {suggestions.map((s, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(s)}
              className="whitespace-nowrap px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100 rounded-b-2xl">
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-300 focus-within:bg-white transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Posez une question..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-slate-800 placeholder:text-slate-400"
          />
          <button className="text-slate-400 hover:text-indigo-600 transition-colors">
            <Mic size={18} />
          </button>
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className={`p-1.5 rounded-full transition-all ${input.trim() ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-400'}`}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};


// --- VUES PRINCIPALES ---

// 1. DASHBOARD (Simplifié pour focus sur modifs)
const DashboardView = ({ onNavigate }: { onNavigate: (view: string) => void }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex justify-between items-center md:hidden mb-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">Bonjour,<br/>Me. Abousaid</h1>
        <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
          <MapPin size={10} /> Marrakech
        </p>
      </div>
      <button className="p-2 bg-white border border-slate-200 rounded-full relative shadow-sm">
        <Bell size={20} className="text-slate-600" />
        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white"></span>
      </button>
    </div>

    {/* Widget "Vue d'Aigle" */}
    <div className="grid grid-cols-3 gap-3 md:gap-6">
      <Card className="p-4 bg-slate-900 text-white relative overflow-hidden group cursor-pointer">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Landmark size={60} />
        </div>
        <div className="flex flex-col items-start justify-between h-full relative z-10">
          <span className="text-xs font-medium text-slate-400 uppercase">Audiences</span>
          <div className="mt-2">
            <span className="text-3xl font-bold">{MOCK_STATS.audiences}</span>
            <span className="text-xs text-slate-400 ml-1">Aujourd'hui</span>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border-l-4 border-red-500">
        <div className="flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
            <ShieldAlert size={20} className="text-red-500" />
            <span className="text-xs font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">J-7</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800">{MOCK_STATS.urgences}</span>
            <span className="text-xs text-slate-500 block">Délais critiques</span>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border-l-4 border-emerald-500">
        <div className="flex flex-col h-full justify-between">
          <TrendingUp size={20} className="text-emerald-500" />
          <div>
            <span className="text-lg font-bold text-slate-800 leading-none">18k</span>
            <span className="text-[10px] text-slate-400 block uppercase mt-1">Recouvrement</span>
          </div>
        </div>
      </Card>
    </div>

    {/* Agenda Express */}
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar size={18} className="text-slate-600" /> Prochaines Audiences
        </h2>
        <button onClick={() => onNavigate('agenda')} className="text-xs text-indigo-600 font-bold uppercase tracking-wide bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100">
          Ouvrir l'agenda
        </button>
      </div>
      <div className="space-y-3">
        {MOCK_AGENDA_DETAILED.slice(0, 2).map((item) => (
          <Card key={item.id} className="p-0 flex hover:shadow-md transition-all cursor-pointer group">
            <div className="w-16 flex flex-col items-center justify-center bg-slate-50 border-r border-slate-100 group-hover:bg-indigo-50 transition-colors">
              <span className="text-lg font-bold text-slate-800">{item.time}</span>
            </div>
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                {item.urgent && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin size={12} /> {item.tribunal}</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-[10px] ${
                  item.status === "En cours" ? "bg-green-100 text-green-700" : "bg-slate-100"
                }`}>{item.status}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// 2. AGENDA ENRICHI (Vue Timeline)
const AgendaView = () => {
  const currentDate = "Mardi 05 Décembre";
  
  return (
    <div className="animate-in slide-in-from-right-4 duration-500 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="text-indigo-600" /> Agenda Interactif
          </h2>
          <p className="text-sm text-slate-500 mt-1">{currentDate} • 3 événements</p>
        </div>
        <button className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 relative">
        {/* Timeline Line */}
        <div className="absolute left-16 top-4 bottom-0 w-0.5 bg-slate-200"></div>

        <div className="space-y-8 relative">
          {MOCK_AGENDA_DETAILED.map((item) => (
            <div key={item.id} className="flex gap-6 relative group">
              {/* Time Column */}
              <div className="w-12 pt-1 flex flex-col items-end gap-1 text-right shrink-0">
                <span className="text-sm font-bold text-slate-900">{item.time}</span>
                <span className="text-xs text-slate-400">{item.endTime}</span>
              </div>

              {/* Timeline Dot */}
              <div className={`absolute left-[60px] top-2 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${
                item.urgent ? "bg-red-500" : "bg-indigo-600"
              }`}></div>

              {/* Event Card */}
              <Card className={`flex-1 p-4 border-l-4 ${item.urgent ? "border-l-red-500" : "border-l-indigo-500"} hover:shadow-lg transition-all`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <Badge type={item.urgent ? "urgent" : "normal"}>{item.type}</Badge>
                    <span className="text-xs font-mono text-slate-400">{item.ref}</span>
                  </div>
                  {item.prepared ? (
                     <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                       <CheckCircle size={10} /> PRÊT
                     </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                       <Clock size={10} /> À PRÉPARER
                     </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                  <MapPin size={14} />
                  <span>{item.tribunal}</span>
                </div>

                {item.notes && (
                  <div className="bg-slate-50 p-2 rounded-md border border-slate-100 text-xs text-slate-600 mb-3 italic flex gap-2">
                     <FileText size={14} className="shrink-0 mt-0.5" />
                     {item.notes}
                  </div>
                )}

                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                  <button className="flex-1 text-xs font-medium text-slate-600 py-1.5 hover:bg-slate-50 rounded flex items-center justify-center gap-1">
                    <FileText size={12} /> Dossier
                  </button>
                  <button className="flex-1 text-xs font-medium text-slate-600 py-1.5 hover:bg-slate-50 rounded flex items-center justify-center gap-1">
                    <Navigation size={12} /> Itinéraire
                  </button>
                  {item.prepared && (
                    <button className="flex-1 text-xs font-medium text-slate-600 py-1.5 hover:bg-slate-50 rounded flex items-center justify-center gap-1">
                      <Printer size={12} /> Imprimer
                    </button>
                  )}
                </div>
              </Card>
            </div>
          ))}

           {/* Empty Slot Placeholder */}
           <div className="flex gap-6 relative opacity-50">
              <div className="w-12 pt-1 text-right text-xs text-slate-400">16:00</div>
              <div className="absolute left-[62px] top-2 w-2 h-2 rounded-full bg-slate-300 z-10"></div>
              <div className="flex-1 p-4 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                Aucun événement prévu
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// 3. IA & ANALYSE ENRICHIE
const AIView = () => {
  const [step, setStep] = useState('upload'); // upload, analyzing, result
  const [activeTab, setActiveTab] = useState('strategy'); // strategy, sources, facts

  const startAnalysis = () => {
    setStep('analyzing');
    setTimeout(() => setStep('result'), 2500);
  };

  return (
    <div className="h-full flex flex-col animate-in zoom-in-95 duration-300">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Brain className="text-indigo-600" /> Analyse Stratégique
        </h2>
        <p className="text-sm text-slate-500">Moteur juridique marocain v1.2</p>
      </div>

      {step === 'upload' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={startAnalysis}>
          <div className="w-20 h-20 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-6">
            <Smartphone className="text-slate-700" size={32} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">Scanner un document</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-xs leading-relaxed">
            Prenez en photo une convocation, un jugement ou des conclusions adverses.
          </p>
          <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold shadow-xl shadow-slate-900/20 flex items-center gap-2">
            <Plus size={18} /> Nouvelle analyse
          </button>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <Brain className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={36} />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-3">Analyse en cours...</h3>
          <div className="space-y-2 text-sm text-slate-500">
            <p className="flex items-center gap-2 justify-center"><CheckCircle size={14} className="text-green-500" /> OCR & Traduction</p>
            <p className="flex items-center gap-2 justify-center"><CheckCircle size={14} className="text-green-500" /> Jurisprudence (Marrakech/Rabat)</p>
            <p className="animate-pulse">Calcul du score de succès...</p>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Result */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document détecté</span>
                 <h3 className="font-bold text-slate-900">{MOCK_AI_ANALYSIS_ENRICHED.docType}</h3>
              </div>
              <div className="text-right">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score IA</span>
                 <div className="flex items-center gap-1 justify-end text-emerald-600 font-bold">
                   <TrendingUp size={16} /> {MOCK_AI_ANALYSIS_ENRICHED.confidenceScore}%
                 </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed">
              {MOCK_AI_ANALYSIS_ENRICHED.summary}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-4">
            <button 
              onClick={() => setActiveTab('strategy')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'strategy' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
            >
              Stratégie
            </button>
            <button 
              onClick={() => setActiveTab('sources')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'sources' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
            >
              Sources & Lois
            </button>
            <button 
              onClick={() => setActiveTab('facts')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'facts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
            >
              Faits
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pb-20 space-y-4">
            
            {activeTab === 'strategy' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                {MOCK_AI_ANALYSIS_ENRICHED.strategy.map((step, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${step.impact === 'High' ? 'bg-indigo-600' : 'bg-amber-400'}`}></div>
                    <div className="flex justify-between items-start mb-1 pl-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Étape {step.step}</span>
                      {step.impact === 'High' && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Impact Majeur</span>}
                    </div>
                    <h4 className="font-bold text-slate-900 pl-2 mb-1">{step.action}</h4>
                    <p className="text-sm text-slate-600 pl-2">{step.desc}</p>
                  </div>
                ))}
                
                <div className="bg-slate-900 p-4 rounded-xl text-white mt-4">
                  <h4 className="font-bold flex items-center gap-2 mb-2 text-indigo-300">
                    <Gavel size={18} /> Jurisprudence Clé
                  </h4>
                  <p className="text-sm opacity-90 leading-relaxed italic">
                    "{MOCK_AI_ANALYSIS_ENRICHED.jurisprudence}"
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                 {MOCK_AI_ANALYSIS_ENRICHED.laws.map((law, i) => (
                   <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <div className="flex items-center gap-2 mb-2">
                       <BookOpen size={16} className="text-indigo-600" />
                       <span className="font-bold text-slate-800 text-sm">{law.code} - {law.art}</span>
                     </div>
                     <p className="text-sm text-slate-600 italic font-serif border-l-2 border-slate-300 pl-3">
                       "{law.text}"
                     </p>
                   </div>
                 ))}
                 <button className="w-full py-3 mt-2 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                   <Search size={16} /> Rechercher plus de jurisprudence
                 </button>
              </div>
            )}

            {activeTab === 'facts' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                {MOCK_AI_ANALYSIS_ENRICHED.facts.map((fact, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg text-sm flex gap-3">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                    <span className="text-slate-700">{fact}</span>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className="pt-2 border-t border-slate-100">
             <button 
              onClick={() => setStep('upload')}
              className="w-full py-3 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Nouvelle analyse
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. DOSSIERS LISTE (Inchangé pour l'instant)
const CasesView = () => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Rechercher dossier, référence, tribunal..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-sm"
        />
      </div>
      <button className="p-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20 active:scale-95 transition-transform">
        <Plus size={20} />
      </button>
    </div>

    {MOCK_DOSSIERS.map((dossier) => (
      <Card key={dossier.id} className="p-5 hover:border-slate-300 transition-colors cursor-pointer group">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{dossier.client}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{dossier.ref}</p>
          </div>
          <Badge type={dossier.urgent ? "urgent" : "normal"}>{dossier.type}</Badge>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Contre :</span>
            <span className="font-medium text-slate-700">{dossier.adverse}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Tribunal :</span>
            <span className="font-medium text-slate-700">{dossier.tribunal}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            {dossier.etape}
          </div>
          <span className="text-[10px] text-slate-400">MAJ: {dossier.date}</span>
        </div>
      </Card>
    ))}
  </div>
);


// --- APP PRINCIPALE ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // État pour l'assistant chat

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { id: 'dashboard', icon: Briefcase, label: 'Bureau' },
    { id: 'dossiers', icon: FileText, label: 'Dossiers' },
    { id: 'ia', icon: Brain, label: 'Stratégie' },
    { id: 'agenda', icon: Calendar, label: 'Agenda' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* SIDEBAR (Desktop) */}
      <div className="hidden md:flex flex-col w-72 fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-50">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-slate-900 rounded-lg">
              <Scale size={24} className="text-white" />
            </div>
            <div className="leading-none">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">CABINET</h1>
              <span className="text-sm font-semibold text-slate-500">ABOUSAID TAHER</span>
            </div>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full">
            <MapPin size={10} className="text-slate-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Marrakech</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
                activeTab === item.id 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span>{item.label}</span>
              {item.id === 'dashboard' && <div className="ml-auto w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm">
              <User size={20} className="text-slate-500" />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">Me. Abousaid</p>
              <p className="text-xs text-slate-500 truncate">Avocat titulaire</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 transition-all duration-300 ${isMobile ? 'pb-24' : 'pl-72'}`}>
        
        {/* Header Desktop */}
        <header className="hidden md:flex items-center justify-between px-10 py-6 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
          <h2 className="text-2xl font-bold text-slate-900">
            {navItems.find(n => n.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block group">
              <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher (ex: Dossier TPI Marrakech...)" 
                className="pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all w-72"
              />
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <button className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors relative shadow-sm">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Content Views */}
        <main className="p-4 md:p-10 max-w-6xl mx-auto h-[calc(100vh-100px)]">
          {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
          {activeTab === 'dossiers' && <CasesView />}
          {activeTab === 'ia' && <AIView />}
          {activeTab === 'agenda' && <AgendaView />}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 py-2 flex justify-between items-center z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === item.id ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>

      {/* FLOATING CHAT BUTTON & COMPONENT */}
      <div className="fixed bottom-24 md:bottom-10 right-4 md:right-10 z-[60]">
        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center hover:scale-105 transition-transform group"
          >
            <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        )}
      </div>

      <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

    </div>
  );
}