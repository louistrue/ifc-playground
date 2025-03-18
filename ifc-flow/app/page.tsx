import { IFCPlayground } from "./ifc-playground/components/ifc-playground";

export default function Home() {
  // The IFC Playground will be rendered with full page dimensions
  return (
    <div className="w-full h-full flex-grow">
      <IFCPlayground />
    </div>
  );
}
