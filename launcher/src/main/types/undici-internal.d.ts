// `undici/lib/dispatcher/agent` n'a pas de types propres : ce sont les mêmes que le `Agent`
// exporté par `undici`, seul le chemin d'import runtime diffère (voir httpDispatcher.ts).
declare module 'undici/lib/dispatcher/agent' {
  import { Agent } from 'undici'
  export default Agent
}
