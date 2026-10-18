import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import BattlefieldCanvas from './BattlefieldCanvas';
import DunesdayMark from './DunesdayMark';
import HouseSigil from './HouseSigil';
import WarAudio from './warAudio';
import './App.css';

// Caminho relativo: o nginx do proprio container repassa /api para
// todo-backend:8080, entao o navegador nunca chama a API direto
// O .env.development sobrescreve isso durante o npm start
const API = process.env.REACT_APP_API_URL || '/api';

// Tempo que cada faccao domina a interface antes da virada
const FACTION_INTERVAL = 18000;

// Tempo que cada par de imagens fica no fundo
const CAMPAIGN_INTERVAL = 120000;

// Cada faccao carrega o proprio vocabulario, tirado do universo de origem
const FACTIONS = [
  {
    id: 'arrakis',
    name: 'ARRAKIS',
    region: 'Canopus · Deserto',
    motto: 'O deserto não perdoa',
    placeholder: 'Grave uma ordem na pedra do sietch',
    submit: 'GRAVAR',
    empty: 'Nenhuma ordem gravada. A areia cobriu os registros.',
    remove: 'QUEIMAR',
  },
  {
    id: 'latveria',
    name: 'LATVERIA',
    region: 'Doomstadt · Monarquia Absoluta',
    motto: 'A vontade de Destino é a única lei',
    placeholder: 'Decrete uma nova lei',
    submit: 'DECRETAR',
    empty: 'Nenhum decreto em vigor. O trono aguarda.',
    remove: 'REVOGAR',
  },
];

// Pares de arte do fundo: Arrakis sempre a esquerda, Latveria sempre a direita
// Os arquivos ficam em public/campanha. Se nao existirem, o fundo procedural assume
const CAMPAIGNS = [
  { left: '/campanha/arrakis-1.jpg', right: '/campanha/latveria-1.jpg' },
  { left: '/campanha/arrakis-2.jpg', right: '/campanha/latveria-2.jpg' },
];

// Marcador de ordem ainda aberta
function IconOpen() {
  return (
    <svg className="tally__icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.6 14.4 8 8 14.4 1.6 8Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Marcador do total de ordens registradas
function IconTotal() {
  return (
    <svg className="tally__icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1 15.2 5 8 9 .8 5Z" fill="currentColor" opacity="0.85" />
      <path d="M.8 8.4 8 12.4l7.2-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M.8 11.6 8 15.6l7.2-4" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
    </svg>
  );
}

function App() {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState("");
  const [faction, setFaction] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const [status, setStatus] = useState('conectando');
  const [readyArt, setReadyArt] = useState([]);
  const [campaign, setCampaign] = useState(0);
  const audioRef = useRef(null);

  const fetchTodos = async () => {
    try {
      const response = await axios.get(`${API}/todos`);
      setTodos(response.data);
      setStatus('online');
    } catch (err) {
      setStatus('offline');
    }
  };

  const addTodo = async () => {
    if (task.trim()) {
      const response = await axios.post(`${API}/todos`, { text: task });
      setTodos([...todos, response.data]);
      setTask("");
    }
  };

  const toggleComplete = async (id) => {
    const response = await axios.patch(`${API}/todos/${id}`);
    const updatedTodos = todos.map(todo =>
      todo._id === id ? response.data : todo
    );
    setTodos(updatedTodos);
  };

  const deleteTodo = async (id) => {
    await axios.delete(`${API}/todos/${id}`);
    setTodos(todos.filter(todo => todo._id !== id));
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // Testa quais pares de arte existem antes de pintar qualquer coisa no fundo
  useEffect(() => {
    let alive = true;

    const probe = (src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });

    Promise.all(
      CAMPAIGNS.map(async (pair, i) => {
        const [l, r] = await Promise.all([probe(pair.left), probe(pair.right)]);
        return l && r ? i : null;
      })
    ).then((found) => {
      if (alive) setReadyArt(found.filter((i) => i !== null));
    });

    return () => { alive = false; };
  }, []);

  // Alterna a faccao dominante em ciclo continuo
  useEffect(() => {
    const timer = setInterval(() => {
      setFaction((f) => (f === 0 ? 1 : 0));
    }, FACTION_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // Roda os pares de arte disponiveis em ritmo bem mais lento que a faccao
  useEffect(() => {
    if (readyArt.length < 2) return undefined;
    const timer = setInterval(() => {
      setCampaign((c) => (c + 1) % readyArt.length);
    }, CAMPAIGN_INTERVAL);
    return () => clearInterval(timer);
  }, [readyArt]);

  // Avisa o motor de audio para mudar o timbre junto com a virada visual
  useEffect(() => {
    if (audioRef.current) audioRef.current.setFaction(faction);
  }, [faction]);

  // Encerra o audio se o componente sair da tela
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.stop();
    };
  }, []);

  const toggleAudio = useCallback(() => {
    if (audioOn) {
      audioRef.current.stop();
      audioRef.current = null;
      setAudioOn(false);
    } else {
      // O navegador so libera audio depois de um clique do usuario
      const engine = new WarAudio();
      engine.start();
      engine.setFaction(faction);
      audioRef.current = engine;
      setAudioOn(true);
    }
  }, [audioOn, faction]);

  const current = FACTIONS[faction];
  const pending = todos.filter((t) => !t.completed).length;
  const activeArt = readyArt[campaign];

  return (
    <div className="realm" data-faction={current.id} data-art={readyArt.length > 0}>
      <div className="realm__sky" aria-hidden="true" />

      {readyArt.map((index) => (
        <div
          key={index}
          className={`campaign ${index === activeArt ? 'campaign--live' : ''}`}
          aria-hidden="true"
        >
          <div
            className="campaign__half campaign__half--left"
            style={{ backgroundImage: `url(${CAMPAIGNS[index].left})` }}
          />
          <div
            className="campaign__half campaign__half--right"
            style={{ backgroundImage: `url(${CAMPAIGNS[index].right})` }}
          />
        </div>
      ))}

      {readyArt.length > 0 && <div className="campaign__seam" aria-hidden="true" />}

      <div className="realm__terrain" aria-hidden="true" />
      <div className="realm__structure" aria-hidden="true" />
      {/* Varredura que atravessa a tela a cada troca de mundo */}
      <div className="realm__shift" key={`shift-${faction}`} aria-hidden="true" />
      <BattlefieldCanvas faction={faction} />
      <div className="realm__haze" aria-hidden="true" />
      <div className="realm__grain" aria-hidden="true" />
      <div className="realm__vignette" aria-hidden="true" />

      <header className="banner">
        <div className="banner__mark">
          <HouseSigil />
          <div className="banner__titles">
            <DunesdayMark />
            <p className="banner__sub" key={current.id}>{current.region}</p>
          </div>
        </div>

        <div className="banner__right">
          <div className="faction" key={current.id}>
            <span className="faction__dot" aria-hidden="true" />
            <div className="faction__text">
              <strong>{current.name}</strong>
              <em>{current.motto}</em>
            </div>
          </div>
          <button
            className={`horn ${audioOn ? 'horn--live' : ''}`}
            onClick={toggleAudio}
            aria-pressed={audioOn}
            aria-label={audioOn ? 'Silenciar' : 'Ativar som'}
            title={audioOn ? 'Silenciar' : 'Ativar som'}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 7.5h3L11 4v12L7 12.5H4Z" fill="currentColor" />
              {audioOn ? (
                <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M13.6 7.2a4 4 0 0 1 0 5.6" />
                  <path d="M15.8 5a7 7 0 0 1 0 10" />
                </g>
              ) : (
                <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M14 7.5 18 12.5" />
                  <path d="M18 7.5 14 12.5" />
                </g>
              )}
            </svg>
          </button>
        </div>
      </header>

      <main className="console">
        <div className="console__meta">
          <span className={`pulse pulse--${status}`}>{status.toUpperCase()}</span>
          <span className="tally" title="Em aberto">
            <IconOpen />
            {pending}
          </span>
          <span className="tally" title="Total registrado">
            <IconTotal />
            {todos.length}
          </span>
        </div>

        <form
          className="decree"
          onSubmit={(e) => { e.preventDefault(); addTodo(); }}
        >
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder={current.placeholder}
            aria-label="Nova tarefa"
          />
          <button type="submit" className="decree__submit">{current.submit}</button>
        </form>

        <ul className="orders">
          {todos.length === 0 && (
            <li className="orders__empty">{current.empty}</li>
          )}
          {todos.map((todo) => (
            <li
              key={todo._id}
              className={`order ${todo.completed ? 'order--done' : ''}`}
            >
              <button
                className="order__check"
                onClick={() => toggleComplete(todo._id)}
                aria-label="Alternar conclusão"
              >
                <span aria-hidden="true" />
              </button>
              <span
                className="order__text"
                onClick={() => toggleComplete(todo._id)}
              >
                {todo.text}
              </span>
              <button
                className="order__kill"
                onClick={() => deleteTodo(todo._id)}
                aria-label="Excluir tarefa"
              >
                {current.remove}
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default App;
