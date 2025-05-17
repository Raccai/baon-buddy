import { playSound } from "./soundManager";

export function sfxClick(node) {
  const handleClick = () => {
    playSound('click');
  };

  node.addEventListener('click', handleClick);

  return {
    destroy() {
      node.removeEventListener('click', handleClick);
    }
  }
}