import { ModelSetupForm } from "@/components/model-setup-form";
import "./model-setup.css";

export default function ModelSetup() {
  return (
    <main className="model-setup-page">
      <div className="model-setup-shell">
        <ModelSetupForm />
      </div>
    </main>
  );
}
