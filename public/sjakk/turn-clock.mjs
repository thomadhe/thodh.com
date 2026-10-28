export class TurnClock {
  constructor(seconds = 60, now = () => Date.now()) {
    this.now = now;
    this.reset(seconds);
  }
  reset(seconds = this.seconds) {
    this.seconds = seconds;
    this.saved = seconds * 1000;
    this.deadline = this.now() + this.saved;
  }
  remaining() {
    return Math.max(0, this.deadline === null ? this.saved : this.deadline - this.now());
  }
  pause() {
    this.saved = this.remaining();
    this.deadline = null;
  }
  resume() {
    if (this.deadline === null) this.deadline = this.now() + this.saved;
  }
  expired() {
    return this.deadline !== null && this.remaining() <= 0;
  }
  get paused() { return this.deadline === null; }
}

export function formatTime(milliseconds) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export const timeoutNotice = {
  kind: 'timeout',
  title: 'Tissforbrytelse',
  description: 'Special kiss for å fortsette 😉',
  icon: '😉',
};
