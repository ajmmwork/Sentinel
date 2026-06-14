import sentinelBot from "@/assets/generated/sentinel-bot.png";
import "./test.css";

export default function Test() {
  return (
    <main className="test-page">
      <div className="test-bot-icon" aria-label="Sentinel bot blinking and becoming ready">
        <img className="test-bot-image" src={sentinelBot} alt="" />
        <span className="test-bot-eye test-bot-eye-left" aria-hidden="true" />
        <span className="test-bot-eye test-bot-eye-right" aria-hidden="true" />
        <span className="test-bot-ready-eye test-bot-ready-eye-left" aria-hidden="true" />
        <span className="test-bot-ready-eye test-bot-ready-eye-right" aria-hidden="true" />
      </div>
    </main>
  );
}
