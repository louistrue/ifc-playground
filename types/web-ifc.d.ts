declare module "web-ifc" {
  export const IFCPROJECT: number;
  export const IFCSITE: number;
  export const IFCBUILDING: number;
  export const IFCBUILDINGSTOREY: number;

  export interface IFCLoadingSettings {
    COORDINATE_TO_ORIGIN?: boolean;
    USE_FAST_BOOLS?: boolean;
  }

  export interface IFCGeometry {
    GetVertexData(): any;
    GetVertexDataSize(): number;
    GetIndexData(): any;
    GetIndexDataSize(): number;
    delete(): void;
  }

  export interface IFCMeshData {
    geometries: {
      size(): number;
      get(index: number): {
        color: { x: number; y: number; z: number; w: number };
        geometryExpressID: number;
        flatTransformation: number[];
      };
    };
    expressID: number;
  }

  export class IfcAPI {
    wasmModule: any;

    constructor();
    Init(wasmPath?: string): Promise<void>;
    OpenModel(data: Uint8Array, settings?: IFCLoadingSettings): number;
    GetGeometry(modelID: number, geometryExpressID: number): IFCGeometry;
    GetVertexArray(ptr: any, size: number): Float32Array;
    GetIndexArray(ptr: any, size: number): Uint32Array;
    StreamAllMeshes(
      modelID: number,
      callback: (mesh: IFCMeshData) => void
    ): void;
    CloseModel(modelID: number): void;
    SetWasmPath(path: string, absolute: boolean): void;
  }
}
