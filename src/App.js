import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { uniq } from "lodash";
import "./App.css";
const url = `http://127.0.0.1:8000/`;
// const url = `https://pytnik-backend.vercel.app/`;

function App() {
  const [selectedAgent, setSelectedAgent] = useState("0");
  const [goldCoins, setGoldCoins] = useState([]);
  const [agentImage, setAgentImage] = useState("Aki.png");
  const [selectedMap, setSelectedMap] = useState("map1");
  const [mapContent, setMapContent] = useState("");
  const [agentPosition, setAgentPosition] = useState({ x: 0, y: 0 });
  const [visitedCoins, setVisitedCoins] = useState([]);
  const [opisi, setOpisi] = useState([]);
  const [isPaused, setIsPaused] = useState(true);
  const [step, setStep] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameInterrupted, setIsGameInterrupted] = useState(false);
  const [isStepByStepMode, setIsStepByStepMode] = useState(false);
  const [currentSimulationStep, setCurrentSimulationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dataAgent, setDataAgent] = useState({
    agent: [],
    putanje: [],
    zlatnici: [],
    opisPutanja: [],
    zbir: "",
  });
  const animationTimeoutRef = useRef();
  const currentStepRef = useRef(0);
  const buttonRef = useRef(null);

  function changeAgent(agentIndex, agentImage) {
    if (isAnimating) return;
    setSelectedAgent(agentIndex);
    setAgentImage(agentImage);
    setVisitedCoins([]);
    setStep(0);
    setOpisi([]);
    setIsGameOver(false);
    setIsPaused(true);
    setIsStepByStepMode(false);
    setShowSteps(false);
  }

  const handleMapChange = (e) => {
    setSelectedMap(e.target.value);
    setVisitedCoins([]);
    setStep(0);
    setOpisi([]);
    setIsStepByStepMode(false);
    setIsGameOver(false);
    setIsPaused(true);
    setShowSteps(false);
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
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
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
  }, []);

  useEffect(() => {
    if (isGameInterrupted) {
      completeGame();
      setIsGameInterrupted(false);
      setIsAnimating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameInterrupted]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      e.preventDefault();
      if (e.key === " ") {
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
    setIsGameOver(true);
    setIsGameInterrupted(false);
  };

  const handleSubmit = async () => {
    setOpisi([]);
    setIsPaused(false);
    setVisitedCoins([]);
    setIsGameOver(false);
    setCurrentSimulationStep(0);
    setStep(1);
    const data = {
      mapContent: mapContent,
      agentIndex: selectedAgent,
    };
    console.log(data);
    try {
      const response = await axios.post(url, data);
      console.log("Dobijeni podaci:", response.data);
      setDataAgent(response.data.data);
      dataAgent.opisPutanja = response.data.data.opisPutanja;
      dataAgent.agent = response.data.data.agent;
      dataAgent.agent.shift();
      animateAgent(response.data.data.agent);
      if (buttonRef.current) {
        buttonRef.current.blur();
      }
    } catch (error) {
      console.error("Došlo je do greške:", error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      e.preventDefault();
      if (isGameOver) {
        return;
      }
      if (e.key === "s") {
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
      } else if (isStepByStepMode && e.key === "ArrowRight") {
        const nextStep = Math.min(
          currentSimulationStep + 1,
          dataAgent.agent.length - 1
        );
        animateAgent(dataAgent.agent, nextStep);
        setCurrentSimulationStep(nextStep);
        setStep(step + 1);
        if (nextStep === dataAgent.agent.length - 1) {
          setIsAnimating(false);
        }
      } else if (isStepByStepMode && e.key === "ArrowLeft") {
        const prevStep = Math.max(currentSimulationStep - 1, 0);
        animateAgent(dataAgent.agent, prevStep);
        setCurrentSimulationStep(prevStep);
        setStep(step - 1);
        if (prevStep === dataAgent.agent.length - 1) {
          setIsAnimating(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStepByStepMode, currentSimulationStep, dataAgent.agent]);

  const animateAgent = (path, startStep = 0) => {
    setIsAnimating(true);
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
            setOpisi((opis) => [...opis, opis1]);
            if (!isStepByStepMode) {
              setStep(step + 1);
            }

            if (index === path.length - 1) {
              setIsGameOver(true);
            }
            currentStepRef.current = index + 1;
            if (!isStepByStepMode) {
              animationTimeoutRef.current = setTimeout(() => {
                moveAgent(index + 1);
              }, 2500);
            }
          } else {
            console.error("error", nextPosition);
          }
        } else {
          console.error("Index je izvan granica", path[index]);
        }
      }
      if (index === path.length) {
        setIsGameOver(true);
        setIsAnimating(false);
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
    <div className="Appalmir">
      <h1 className="naziv"></h1>
      <div className="agents">
        <p className="izaberiAgenta"></p>
        <div
          className={selectedAgent === "0" ? "selected-agent" : "agent"}
          onClick={() => changeAgent("0", "Akii.png")}
          style={{ cursor: isAnimating ? "not-allowed" : "pointer" }}
        >
          <img src="Akii.png" alt="" />
          <h3>Aki</h3>
        </div>
        <div
          className={selectedAgent === "1" ? "selected-agent" : "agent"}
          onClick={() => changeAgent("1", "Jockee.png")}
          style={{ cursor: isAnimating ? "not-allowed" : "pointer" }}
        >
          <img src="Jockee.png" alt="" />
          <h3>Jocke</h3>
        </div>
        <div
          className={selectedAgent === "2" ? "selected-agent" : "agent"}
          onClick={() => changeAgent("2", "Ukii.png")}
          style={{ cursor: isAnimating ? "not-allowed" : "pointer" }}
        >
          <img src="Ukii.png" alt="" />
          <h3>Uki</h3>
        </div>
        <div
          className={selectedAgent === "3" ? "selected-agent" : "agent"}
          onClick={() => changeAgent("3", "Mickoo.png")}
          style={{ cursor: isAnimating ? "not-allowed" : "pointer" }}
        >
          <img src="Mickoo.png" alt="" />
          <h3>Micko</h3>
        </div>
        <div className="mapSelection">
          <select
            onChange={handleMapChange}
            disabled={isAnimating}
            style={{ cursor: isAnimating ? "not-allowed" : "pointer" }}
          >
            <option value="map1">Mapa 1</option>
            <option value="map2">Mapa 2</option>
            <option value="map3">Mapa 3</option>

            <option value="map4">Mapa 4</option>
          </select>
        </div>
        <div
          className="dugme"
          style={{ cursor: isAnimating ? "not-allowed" : "pointer" }}
        >
          <button
            ref={buttonRef}
            onClick={handleSubmit}
            className={isAnimating ? "no-hover" : ""}
            disabled={isAnimating}
          >
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
                Putanja od {opis}
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
