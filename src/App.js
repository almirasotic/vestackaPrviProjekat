import "./App.css";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { uniq } from "lodash";
const url = `http://127.0.0.1:8000/IGRA`;

function App() {
  const [selectedAgent, setSelectedAgent] = useState("0");
  const [goldCoins, setGoldCoins] = useState([]);
  const [agentImage, setAgentImage] = useState("Akii.png");
  const [cost, setCost] = useState(0);
  const [selectedMap, setSelectedMap] = useState("map1");
  const [mapContent, setMapContent] = useState("");
  const [agentPosition, setAgentPosition] = useState({ x: 0, y: 0 });
  const [visitedCoins, setVisitedCoins] = useState([]);
  const [dataAgent, setDataAgent] = useState({
    agent: [],
    agentIndex1: "",
    putanje: [],
    zlatnici: [],
    opisPutanja: [],
    zbir: "",
  });
  const [opisi, setOpisi] = useState([]);
  const [isPaused, setIsPaused] = useState(true);
  const [step, setStep] = useState(1);
  const [showSteps, setShowSteps] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameInterrupted, setIsGameInterrupted] = useState(false);
  const animationTimeoutRef = useRef();
  const currentStepRef = useRef(0);
  const buttonRef = useRef(null);
  const [isStepByStepMode, setIsStepByStepMode] = useState(false);
  const [currentSimulationStep, setCurrentSimulationStep] = useState(0);

  function changeAgent(agentIndex, agentImg) {
    setSelectedAgent(agentIndex);
    setAgentImage(agentImg);
    setVisitedCoins([]);
    setStep(1);
    setOpisi([]);
    setIsGameOver(false);
    setIsGameInterrupted(false);
    setCost(0);
    setAgentPosition({ x: 0, y: 0 });
    setIsStepByStepMode(false);
  }

  const handleMapChange = (event) => {
    setSelectedMap(event.target.value);
    setVisitedCoins([]);
    setStep(1);
    setOpisi([]);
    setIsGameOver(false);
    setIsGameInterrupted(false);
    setCost(0);
    setAgentPosition({ x: 0, y: 0 });
    setIsStepByStepMode(false);
  };

  useEffect(() => {
    fetch(`Maps/${selectedMap}.txt`)
      .then((response) => response.text())
      .then((text) => {
        setMapContent(text);
        const lines = text.split("\n");
        const coins = lines.map((line) => {
          const parts = line.split(",").map(Number);
          return { x: parts[0], y: parts[1] };
        });
        setGoldCoins(coins);
      });
  }, [selectedMap]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        setIsGameInterrupted(true);
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        setIsGameOver(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goldCoins]);

  useEffect(() => {
    if (isGameInterrupted) {
      console.log("zavrsena igra");
      completeGame();
      setIsGameInterrupted(false);
    }
  }, [isGameInterrupted]);

  const completeGame = () => {
    const newVisitedCoins = goldCoins.map((_, index) => true);
    setVisitedCoins(newVisitedCoins);

    if (goldCoins.length > 0) {
      const startPosition = goldCoins[0];
      setAgentPosition({
        x: startPosition.x - startPosition.x,
        y: startPosition.y - startPosition.y,
      });
    }
    setStep(goldCoins.length);
    setOpisi(dataAgent.opisPutanja);
    setCost(dataAgent.zbir);
    setIsGameOver(true);
    setIsGameInterrupted(false);
  };

  const handleSubmit = async () => {
    setOpisi([]);
    setCost(0);
    setIsPaused(false);
    setVisitedCoins([]);
    setIsGameOver(false);
    setIsStepByStepMode(false);
    setCurrentSimulationStep(0);
    setIsGameInterrupted(false);
    setStep(0);
    const data = {
      mapContent: mapContent,
      agentIndex: selectedAgent,
    };
    try {
      const response = await axios.post(url, data);
      setDataAgent(response.data.data);
      dataAgent.opisPutanja = response.data.data.opisPutanja;
      dataAgent.agent = response.data.data.agent;
      dataAgent.agent.shift();
      animateAgent(response.data.data.agent);
      if (buttonRef.current) {
        buttonRef.current.blur();
      }
    } catch (error) {
      console.error("GRESKA!!!", error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      event.preventDefault();
      if (event.key === " ") {
        setIsPaused((prev) => {
          if (!prev) {
            clearTimeout(animationTimeoutRef.current);
          } else {
            animateAgent(dataAgent.agent, currentStepRef.current - 1);
          }
          return !prev;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, dataAgent]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      event.preventDefault();
      if (isGameOver) {
        return;
      }
      if (event.key === "s") {
        setIsStepByStepMode((prev) => {
          if (prev === false) {
            clearTimeout(animationTimeoutRef.current);
            setCurrentSimulationStep(currentStepRef.current - 1);
          } else if (prev === true) {
            animateAgent(dataAgent.agent, currentStepRef.current - 1);
          }
          return !prev;
        });
        setShowSteps(!showSteps);
      } else if (isStepByStepMode && event.key === "ArrowRight") {
        const nextStep = Math.min(
          currentSimulationStep + 1,
          dataAgent.agent.length - 1
        );
        animateAgent(dataAgent.agent, nextStep);
        setCurrentSimulationStep(nextStep);
        setStep(step + 1);
      } else if (isStepByStepMode && event.key === "ArrowLeft") {
        const prevStep = Math.max(currentSimulationStep - 1, 0);
        animateAgent(dataAgent.agent, prevStep);
        setCurrentSimulationStep(prevStep);
        setStep(step - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isStepByStepMode, currentSimulationStep, dataAgent]);

  useEffect(() => {
    if (isStepByStepMode) {
      animateAgent(dataAgent.agent, currentSimulationStep);
    }
  }, [isStepByStepMode, currentSimulationStep, dataAgent]);
  const animateAgent = (path, startStep = 0) => {
    const moveAgent = (index) => {
      currentStepRef.current = index;
      if (index < path.length) {
        if (path[index] < goldCoins.length) {
          const nextPosition = goldCoins[path[index]];
          if (nextPosition && "x" in nextPosition && "y" in nextPosition) {
            createAgentAnimation(agentPosition, nextPosition);
            setVisitedCoins((prev) => ({ ...prev, [path[index - 1]]: true }));
            setAgentPosition({
              x: nextPosition.x - goldCoins[0].x,
              y: nextPosition.y - goldCoins[0].y,
            });
            let i = index;
            const opis1 = dataAgent.opisPutanja[i];
            if (!isStepByStepMode) {
              setStep(step + 1);
            }
            setOpisi((opis) => [...opis, opis1]);
            const delovi = opis1.split(":");
            delovi[1] = delovi[1].trim();
            if (!isNaN(delovi[1])) {
              setCost((prev) => prev + parseFloat(delovi[1]));
            }

            if (index === path.length - 1) {
              // Kada agent dođe do poslednjeg zlatnika
              setIsGameOver(true);
            }

            currentStepRef.current = index + 1;
            if (!isStepByStepMode) {
              animationTimeoutRef.current = setTimeout(() => {
                moveAgent(index + 1);
              }, 2500);
            }
          } else {
            console.error("Nevalidna pozicija zlatnika", nextPosition);
          }
        } else {
          console.error("Indeks je van granica niza 'goldCoins'", path[index]);
        }
      }
      if (index === path.length) {
        setIsGameOver(true);
      }
    };
    moveAgent(startStep);
  };

  const createAgentAnimation = (fromPosition, toPosition) => {
    const keyframes = `
      @keyframes moveAgent {
        from {
          left: ${fromPosition.x}px;
          top: ${fromPosition.y}px;
        }
        to {
          left: ${toPosition.x - goldCoins[0].x}px;
          top: ${toPosition.y - goldCoins[0].y}px;
        }
      }
    `;

    const styleSheet = document.styleSheets[0];
    if (styleSheet.cssRules.length > 0) {
      styleSheet.deleteRule(0);
    }
    styleSheet.insertRule(keyframes, 0);
  };

  return (
    <div className="App">
      <h1 className="naziv"></h1>
      <div className="agents">
        <p className="izaberiAgenta"></p>
        <div
          className={selectedAgent === "0" ? "selected-agent" : "agent"}
          onClick={() => changeAgent("0", "Akii.png")}
        >
          <img src="Akii.png" alt="" />
          <h3>Aki</h3>
        </div>
        <div
          className={selectedAgent === "1" ? "selected-agent" : "agent"}
          onClick={() => changeAgent("1", "Jocke.png")}
        >
          <img src="Jocke.png" alt="" />
          <h3>Jocke</h3>
        </div>
        <div
          className={selectedAgent === "2" ? "selected-agent" : "agent"}
          onClick={() => changeAgent("2", "Uki.png")}
        >
          <img src="Uki.png" alt="" />
          <h3>Uki</h3>
        </div>
        <div
          className={selectedAgent === "3" ? "selected-agent" : "agent"}
          onClick={() => changeAgent("3", "Micko.png")}
        >
          <img src="Micko.png" alt="" />
          <h3>Micko</h3>
        </div>
        <div className="mapSelection">
          <select onChange={handleMapChange}>
            <option value="map1">Mapa 1</option>
            <option value="map2">Mapa 2</option>
            <option value="map3">Mapa 3</option>

            <option value="map4">Mapa 4</option>
          </select>
        </div>
        <div className="dugme">
          <button ref={buttonRef} onClick={handleSubmit}>
            START
          </button>
        </div>
      </div>
      <div className="mapa">
        <div className="terrain">
          <img src="terrain.png" alt="Terrain" />
          {goldCoins.map((coin, index) => (
            <div
              key={index}
              className="goldCoin"
              style={{
                left: coin.x + "px",
                top: coin.y + "px",
                backgroundColor: visitedCoins[index] ? "transparent" : "yellow",
                color: visitedCoins[index] ? "red" : "black",
              }}
            >
              {index === 0 ? (
                <>
                  <img
                    className="slAgent"
                    src={agentImage}
                    alt="Agent"
                    style={{
                      position: "absolute",
                      left: agentPosition.x + "px",
                      top: agentPosition.y + "px",
                      animation: "moveAgent 2s",
                      transition: "all 2s",
                    }}
                  />
                  <p>{index}</p>
                </>
              ) : (
                <p>{index}</p>
              )}
            </div>
          ))}
          {showSteps && (
            <p className="koraci">
              Step: {step}/{goldCoins.length}
            </p>
          )}
          {isPaused && visitedCoins.length !== goldCoins.length && (
            <p className="pauza">PAUSED</p>
          )}
          {isGameOver && <p className="pauza">GAME OVER</p>}
        </div>
        <div className="data">
          <h2>======Steps======</h2>
          <div className="opisiPutanja">
            {uniq(opisi).map((opis, index) => (
              <div className="opis" key={index}>
                Putanja od   {opis}
              </div>
            ))}
          </div>
          <div>
            <h2>================</h2>
            <h2>
              Cost:{" "}
              {uniq(opisi)
                .map((opis) => +opis.split(":")[1])
                .reduce((a, b) => a + b, 0)}
            </h2>
          </div>
        </div>
      </div>
      {/* <div className="dugme">
        <button ref={buttonRef} onClick={handleSubmit}>
          Kreni
        </button>
      </div> */}
    </div>
  );
}

export default App;
