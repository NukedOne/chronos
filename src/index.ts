import * as moment from 'moment-timezone';

const CANVAS_SIZE = 520;

const CIRCLE_LINE_WIDTH = 0.5;

const SCALE = 15;
const CLOCK_RADIUS = 17;
const LETTERS_RADIUS = 5;
const LETTERS_OUTER_RADIUS = 8;

const CLOCK_LID_COLOR = '#333';
const TICK_COLOR = 'white';
const NUMBERS_COLOR = 'white';
const LETTERS_COLOR = 'white';
const HOUR_HAND_COLOR = 'red';
const MINUTES_HAND_COLOR = 'red';
const SECONDS_HAND_COLOR = '#333';
const CURRENT_HOUR_COLOR = 'red';

const LETTERS_DISTANCE = 6.5;
const HOURS_DISTANCE = 9.5;
const MINUTES_DISTANCE = 15;

const HOUR_HAND_LENGTH = 5.5;
const MINUTES_HAND_LENGTH = 15;
const SECONDS_HAND_LENGTH = 16.5;

const HOUR_HAND_WIDTH = 3;
const MINUTES_HAND_WIDTH = 3;
const SECONDS_HAND_WIDTH = 1;

const HOURS_X_OFFSET = 0.5 * SCALE;
const HOURS_Y_OFFSET = 0.3 * SCALE;
const MINUTES_X_OFFSET = 0.6 * SCALE;
const MINUTES_Y_OFFSET = 0.3 * SCALE;
const LETTERS_X_OFFSET = 0.3 * SCALE;
const LETTERS_Y_OFFSET = 0.3 * SCALE;

const CLOCK_LID_RADIUS = 0.75;

const LETTERS: Record<number, string> = {
  1: 'B',  2: 'C',  3: 'D',  4: 'E',
  5: 'F',  6: 'G',  7: 'H',  8: 'J',
  9: 'K', 10: 'L', 11: 'M', 12: 'N',
  13: 'P', 14: 'Q', 15: 'R', 16: 'S',
  17: 'T', 18: 'U', 19: 'V', 20: 'W',
  21: 'X', 22: 'Y', 23: 'Z', 24: 'A',
  0: 'A',
};

class Clock {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private timezoneSelect: HTMLSelectElement;
  private timezoneOffset: number;
  private timezone: string;
  private secondsDial: Vec2;

  constructor() {
    this.timezoneSelect = document.getElementById('timezone') as HTMLSelectElement;
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.secondsDial = new Vec2(0, 1);

    this.setCanvasSize(this.canvas);
    this.setCanvasColor(this.canvas, 'black');
    this.populateSelectBox();
    this.addEventListeners();

    this.timezone = moment.tz.guess();
    this.timezoneOffset = this.getTimezoneOffset(this.timezone);
    this.updateTimezoneInfo();
  }

  private setCanvasColor(canvas: HTMLCanvasElement, color: string) {
    canvas.style.background = color;
  }

  private getTimezoneOffset(zone: string): number {
    /* How far ahead (or behind) is the user from UTC, in hours. */
    return -moment.tz.zone(zone)!.utcOffset(new Date().getTime()) / 60;
  }

  private updateTimezoneInfo() {
    document.getElementById('tz-info')!.innerText = `${this.timezone}`;
  }

  private updateEverywhereInfo() {
    const hour = new Date().getUTCHours();
    const minutes = new Date().getUTCMinutes();
    const letter = LETTERS[hour];

    document.getElementById('everywhere')!.innerText = `It's ${letter}:${minutes} everywhere.`;
  }

  private addEventListeners() {
    this.timezoneSelect.addEventListener('change', () => {
      this.timezone = this.timezoneSelect.options[this.timezoneSelect.selectedIndex].text;
      const offset = this.timezoneSelect.value;
      this.timezoneOffset = parseInt(offset);
      this.updateTimezoneInfo();
    });
  }

  private setCanvasSize(canvas: HTMLCanvasElement) {
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
  }

  private populateSelectBox() {
    const timezones = moment.tz.names();
    
    for (const zone of timezones) {
      const option = document.createElement('option');
      const offset = this.getTimezoneOffset(zone);
      
      option.value = offset.toString();
      option.innerText = zone;
      
      this.timezoneSelect.appendChild(option);
    }
  }

  private drawCircle(center: Vec2, r: number, fill?: string, stroke?: string) {
    this.ctx.beginPath();
    this.ctx.lineWidth = CIRCLE_LINE_WIDTH;
    this.ctx.arc(
      center.x,
      center.y,
      SCALE * r,
      0,
      2 * Math.PI,
    );
    
    if (stroke) {
      this.ctx.strokeStyle = stroke;
      this.ctx.stroke();
    }

    if (fill) {
      this.ctx.fillStyle = fill;
      this.ctx.fill();
    }

    this.ctx.closePath();
  }

  private drawHours() {
    for (let hour = 1; hour <= 24; hour++) {
      /* A full turn is 2pi.
       * We need 24th of a turn, because we have that many letters,
       * which is 1/24 * 2pi, that is 1/12pi, that is pi/12.
       * 
       * We want to position the letters starting from the bottom,
       * which is -pi/2. */
      const angle = -hour * (Math.PI / 12) - Math.PI / 2;
      const coord = new Vec2(Math.cos(angle), Math.sin(angle));
      const canvasCoord = math2Canvas(coord.scalarMul(HOURS_DISTANCE));
      const adjustedCanvasCoord = new Vec2(
        canvasCoord.x - HOURS_X_OFFSET,
        canvasCoord.y + HOURS_Y_OFFSET,
      );
      
      this.ctx.beginPath();
      this.ctx.fillStyle = NUMBERS_COLOR;
      this.ctx.font = '12px sans-serif';
      this.ctx.fillText(
        hour.toString(),
        adjustedCanvasCoord.x,
        adjustedCanvasCoord.y,
      );
      this.ctx.closePath();
    }
  }

  private drawMinutes() {
    for (let minute = 1; minute <= 12; minute++) {
      const angle = -minute * (Math.PI / 6) + Math.PI / 2;
      const coord = new Vec2(Math.cos(angle), Math.sin(angle));
      const canvasCoord = math2Canvas(coord.scalarMul(MINUTES_DISTANCE));
      
      this.ctx.beginPath();
      this.ctx.fillStyle = 'white';
      this.ctx.font = '12px sans-serif';
      this.ctx.fillText(
        (5 * minute).toString(),
        canvasCoord.x - MINUTES_X_OFFSET,
        canvasCoord.y + MINUTES_Y_OFFSET,
      );
      this.ctx.closePath();
    }
  }

  private drawLetters() {
    for (let hour = 1; hour <= 24; hour++) {
      const angle = -(hour + this.timezoneOffset) * (Math.PI / 12) - (Math.PI / 2);
      const coord = new Vec2(Math.cos(angle), Math.sin(angle));
      const canvasCoord = math2Canvas(coord.scalarMul(LETTERS_DISTANCE));
      const adjustedCanvasCoord = new Vec2(
        canvasCoord.x - LETTERS_X_OFFSET,
        canvasCoord.y + LETTERS_Y_OFFSET,
      );

      const currentHour = new Date().getUTCHours();

      this.ctx.beginPath();
      this.ctx.font = '15px sans-serif';
      this.ctx.fillStyle = LETTERS[hour] === LETTERS[currentHour] ? CURRENT_HOUR_COLOR : LETTERS_COLOR;
      this.ctx.fillText(LETTERS[hour], adjustedCanvasCoord.x, adjustedCanvasCoord.y);
      this.ctx.closePath();
    }
  }

  private drawTicks(count: number, distance: number, length: number) {
    for (let tick = 1; tick <= count; tick++) {
      const angle = tick * (Math.PI / (count / 2));
      const coord = new Vec2(Math.cos(angle), Math.sin(angle));
      const canvasCoord = math2Canvas(coord.scalarMul(distance));
      const tickAttachment = math2Canvas(coord.scalarMul(distance + length));
      
      this.ctx.beginPath();
      this.ctx.moveTo(canvasCoord.x, canvasCoord.y);
      this.ctx.lineTo(tickAttachment.x, tickAttachment.y);
      this.ctx.strokeStyle = TICK_COLOR;
      this.ctx.stroke();
      this.ctx.closePath();
    }
  }

  private drawDial(angle: number, length: number, stroke: string, width: number) {
    const dialOrigin = math2Canvas(new Vec2(0, 0));
    const dialCoords = math2Canvas(new Vec2(Math.cos(angle), Math.sin(angle)).scalarMul(length));

    this.ctx.beginPath();
    this.ctx.moveTo(dialOrigin.x, dialOrigin.y);
    this.ctx.lineTo(dialCoords.x, dialCoords.y);
    this.ctx.lineWidth = width;
    this.ctx.strokeStyle = stroke;
    this.ctx.stroke();
    this.ctx.closePath();
  }

  public rotateSecondsDial() {
    this.secondsDial = this.secondsDial.rotateClockwise(Math.PI / 30);
  }

  public reDraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawCircle(math2Canvas(new Vec2(0, 0)), CLOCK_RADIUS, undefined, 'white');
    this.drawCircle(math2Canvas(new Vec2(0, 0)), LETTERS_RADIUS, undefined, 'white');
    this.drawCircle(math2Canvas(new Vec2(0, 0)), LETTERS_OUTER_RADIUS, undefined, 'white');

    this.drawHours();
    this.drawLetters();
    this.drawTicks(24, 10.5, 1.5);
    this.drawTicks(12, 16, 0.5);
    this.drawTicks(60, 16.5, 0.5);
    this.drawMinutes();

    const hours = new Date().getUTCHours();
    const minutes = new Date().getUTCMinutes();
    const seconds = new Date().getUTCSeconds();

    const hourAngle = -(hours + this.timezoneOffset) * (Math.PI / 12) - Math.PI / 2;
    const minutesAngle = -minutes * (Math.PI / 30) + Math.PI / 2;
    const secondsAngle = -seconds * (Math.PI / 30) + Math.PI / 2;

    this.drawDial(
      hourAngle,
      HOUR_HAND_LENGTH,
      HOUR_HAND_COLOR,
      HOUR_HAND_WIDTH,
    );
    this.drawDial(
      minutesAngle,
      MINUTES_HAND_LENGTH,
      MINUTES_HAND_COLOR,
      MINUTES_HAND_WIDTH,
    );
    this.drawDial(
      secondsAngle,
      SECONDS_HAND_LENGTH,
      SECONDS_HAND_COLOR,
      SECONDS_HAND_WIDTH,
    );

    this.drawCircle(math2Canvas(new Vec2(0, 0)), CLOCK_LID_RADIUS, CLOCK_LID_COLOR);
    this.updateEverywhereInfo();
  }
}

class Vec2 {
  constructor(public x: number, public y: number) {}

  public scalarMul(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  public rotateClockwise(angle: number): Vec2 {
    const rotationMatrix: number[][] = [
      [Math.cos(angle), Math.sin(angle)],
      [-Math.sin(angle), Math.cos(angle)],
    ];
    const [row1, row2] = rotationMatrix;
    return new Vec2(
      this.x * row1[0] + this.y * row1[1],
      this.x * row2[0] + this.y * row2[1],
    );
  }
}

const math2Canvas = (coord: Vec2): Vec2 => {
  /* Math coordinates work such that (0, 0) is the circle center,
   * because rotating around (0, 0) is much easier than rotating
   * around any other point.
   * 
   * We need to convert these coords into canvas coords.
   * 
   * The thing with canvas coords is that (0, 0) in canvas is the
   * top-left corner, and more 'y' in math means going UP, while
   * more 'y' in canvas coords means going DOWN, so we need the minus
   * to flip the direction. */
  return new Vec2(
    SCALE * coord.x + CANVAS_SIZE / 2,
    SCALE * (-coord.y) + CANVAS_SIZE / 2,
  );
};

async function main() {
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  const clock = new Clock();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    clock.rotateSecondsDial();
    clock.reDraw();
    await delay(1000);
  }
}

document.addEventListener('DOMContentLoaded', main);