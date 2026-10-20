/*
 * Interactive Learning Board simulator
 *
 * Menu, challenge logic, LED, buzzer, and OLED behavior are reconstructed
 * line by line from the project's original Arduino firmware
 * (aisaiahcode/aisaiahcode.ino in the interactive-learning-board repository).
 * Electrical inputs (joystick, button, analog pin A2) are simulated in the
 * browser.
 *
 * The OLED renderer is a port of the text-rendering code in the SSD1306Ascii
 * Arduino library (version 1.3.5), and ARIAL14 below is a subset of the
 * Arial14 bitmap font distributed with that library (font data created with
 * FontCreator by F. Maximilian Thiele). SSD1306Ascii is distributed under the
 * following license:
 *
 *   MIT License
 *
 *   Copyright (c) 2011..2023 Bill Greiman
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a
 *   copy of this software and associated documentation files (the
 *   "Software"), to deal in the Software without restriction, including
 *   without limitation the rights to use, copy, modify, merge, publish,
 *   distribute, sublicense, and/or sell copies of the Software, and to
 *   permit persons to whom the Software is furnished to do so, subject to
 *   the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included
 *   in all copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 *   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 *   IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 *   CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 *   TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 *   SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
(() => {
  'use strict';

  // ───────────────────────────────────────────────────────────────────────
  // Font: Arial14 (14 px tall, proportional). Only the glyphs the firmware
  // can print are included: every character of its string literals plus
  // the digits, '.', and '-' produced by number printing.
  // Each entry: char code → [width, [row-0 column bytes…, row-1 column bytes…]]
  // ───────────────────────────────────────────────────────────────────────
  const ARIAL14 = {
    height: 14,
    glyphs: {
      32: [2, [0x00, 0x00, 0x00, 0x00]],  // ' '
      33: [1, [0xFE, 0x14]],  // '!'
      45: [4, [0x80, 0x80, 0x80, 0x80, 0x00, 0x00, 0x00, 0x00]],  // '-'
      46: [1, [0x00, 0x10]],  // '.'
      48: [6, [0xFC, 0x02, 0x02, 0x02, 0x02, 0xFC, 0x0C, 0x10, 0x10, 0x10, 0x10, 0x0C]],  // '0'
      49: [3, [0x08, 0x04, 0xFE, 0x00, 0x00, 0x1C]],  // '1'
      50: [6, [0x0C, 0x02, 0x02, 0x82, 0x42, 0x3C, 0x10, 0x18, 0x14, 0x10, 0x10, 0x10]],  // '2'
      51: [6, [0x0C, 0x02, 0x22, 0x22, 0x22, 0xDC, 0x0C, 0x10, 0x10, 0x10, 0x10, 0x0C]],  // '3'
      52: [7, [0x80, 0x40, 0x30, 0x08, 0x04, 0xFE, 0x00, 0x04, 0x04, 0x04, 0x04, 0x04, 0x1C, 0x04]],  // '4'
      53: [6, [0x38, 0x16, 0x12, 0x12, 0x12, 0xE2, 0x0C, 0x10, 0x10, 0x10, 0x18, 0x04]],  // '5'
      54: [6, [0xF8, 0x44, 0x22, 0x22, 0x22, 0xC4, 0x0C, 0x10, 0x10, 0x10, 0x10, 0x0C]],  // '6'
      55: [6, [0x02, 0x02, 0x02, 0xE2, 0x1A, 0x06, 0x00, 0x00, 0x1C, 0x00, 0x00, 0x00]],  // '7'
      56: [6, [0xDC, 0x22, 0x22, 0x22, 0x22, 0xDC, 0x0C, 0x10, 0x10, 0x10, 0x10, 0x0C]],  // '8'
      57: [6, [0x3C, 0x42, 0x42, 0x42, 0x22, 0xFC, 0x08, 0x10, 0x10, 0x10, 0x08, 0x04]],  // '9'
      58: [1, [0x08, 0x10]],  // ':'
      61: [6, [0x90, 0x90, 0x90, 0x90, 0x90, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],  // '='
      62: [6, [0x08, 0x10, 0x10, 0xA0, 0xA0, 0x40, 0x08, 0x04, 0x04, 0x00, 0x00, 0x00]],  // '>'
      65: [9, [0x00, 0x80, 0xE0, 0x9C, 0x82, 0x9C, 0xE0, 0x80, 0x00, 0x18, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x18]],  // 'A'
      66: [7, [0xFE, 0x22, 0x22, 0x22, 0x22, 0x22, 0xDC, 0x1C, 0x10, 0x10, 0x10, 0x10, 0x10, 0x0C]],  // 'B'
      67: [8, [0xF8, 0x04, 0x02, 0x02, 0x02, 0x02, 0x04, 0x08, 0x04, 0x08, 0x10, 0x10, 0x10, 0x10, 0x08, 0x04]],  // 'C'
      68: [8, [0xFE, 0x02, 0x02, 0x02, 0x02, 0x02, 0x04, 0xF8, 0x1C, 0x10, 0x10, 0x10, 0x10, 0x10, 0x08, 0x04]],  // 'D'
      69: [7, [0xFE, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x1C, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10]],  // 'E'
      71: [9, [0xF8, 0x04, 0x02, 0x02, 0x02, 0x42, 0x42, 0x44, 0xC8, 0x04, 0x08, 0x10, 0x10, 0x10, 0x10, 0x10, 0x08, 0x04]],  // 'G'
      74: [5, [0x00, 0x00, 0x00, 0x00, 0xFE, 0x0C, 0x10, 0x10, 0x10, 0x0C]],  // 'J'
      76: [7, [0xFE, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1C, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10]],  // 'L'
      77: [9, [0xFE, 0x0C, 0x30, 0xC0, 0x00, 0xC0, 0x30, 0x0C, 0xFE, 0x1C, 0x00, 0x00, 0x04, 0x18, 0x04, 0x00, 0x00, 0x1C]],  // 'M'
      78: [7, [0xFE, 0x04, 0x18, 0x60, 0x80, 0x00, 0xFE, 0x1C, 0x00, 0x00, 0x00, 0x04, 0x08, 0x1C]],  // 'N'
      79: [9, [0xF8, 0x04, 0x02, 0x02, 0x02, 0x02, 0x02, 0x04, 0xF8, 0x04, 0x08, 0x10, 0x10, 0x10, 0x10, 0x10, 0x08, 0x04]],  // 'O'
      80: [7, [0xFE, 0x42, 0x42, 0x42, 0x42, 0x42, 0x3C, 0x1C, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],  // 'P'
      82: [8, [0xFE, 0x42, 0x42, 0x42, 0xC2, 0x42, 0x42, 0x3C, 0x1C, 0x00, 0x00, 0x00, 0x00, 0x04, 0x08, 0x10]],  // 'R'
      84: [7, [0x02, 0x02, 0x02, 0xFE, 0x02, 0x02, 0x02, 0x00, 0x00, 0x00, 0x1C, 0x00, 0x00, 0x00]],  // 'T'
      86: [9, [0x06, 0x18, 0x60, 0x80, 0x00, 0x80, 0x60, 0x18, 0x06, 0x00, 0x00, 0x00, 0x04, 0x18, 0x04, 0x00, 0x00, 0x00]],  // 'V'
      87: [13, [0x06, 0x38, 0xC0, 0x00, 0xC0, 0x3C, 0x02, 0x3C, 0xC0, 0x00, 0xC0, 0x38, 0x06, 0x00, 0x00, 0x04, 0x18, 0x04, 0x00, 0x00, 0x00, 0x04, 0x18, 0x04, 0x00, 0x00]],  // 'W'
      97: [6, [0x10, 0x88, 0x48, 0x48, 0x48, 0xF0, 0x0C, 0x10, 0x10, 0x10, 0x08, 0x1C]],  // 'a'
      98: [6, [0xFE, 0x10, 0x08, 0x08, 0x08, 0xF0, 0x1C, 0x08, 0x10, 0x10, 0x10, 0x0C]],  // 'b'
      99: [5, [0xF0, 0x08, 0x08, 0x08, 0x10, 0x0C, 0x10, 0x10, 0x10, 0x08]],  // 'c'
      100: [6, [0xF0, 0x08, 0x08, 0x08, 0x10, 0xFE, 0x0C, 0x10, 0x10, 0x10, 0x08, 0x1C]],  // 'd'
      101: [6, [0xF0, 0x48, 0x48, 0x48, 0x48, 0x70, 0x0C, 0x10, 0x10, 0x10, 0x10, 0x08]],  // 'e'
      102: [4, [0x08, 0xFC, 0x0A, 0x0A, 0x00, 0x1C, 0x00, 0x00]],  // 'f'
      103: [6, [0xF0, 0x08, 0x08, 0x08, 0x10, 0xF8, 0x4C, 0x90, 0x90, 0x90, 0x88, 0x7C]],  // 'g'
      104: [6, [0xFE, 0x10, 0x08, 0x08, 0x08, 0xF0, 0x1C, 0x00, 0x00, 0x00, 0x00, 0x1C]],  // 'h'
      105: [1, [0xFA, 0x1C]],  // 'i'
      106: [2, [0x00, 0xFA, 0x80, 0x7C]],  // 'j'
      109: [9, [0xF8, 0x10, 0x08, 0x08, 0xF0, 0x10, 0x08, 0x08, 0xF0, 0x1C, 0x00, 0x00, 0x00, 0x1C, 0x00, 0x00, 0x00, 0x1C]],  // 'm'
      110: [6, [0xF8, 0x10, 0x08, 0x08, 0x08, 0xF0, 0x1C, 0x00, 0x00, 0x00, 0x00, 0x1C]],  // 'n'
      111: [6, [0xF0, 0x08, 0x08, 0x08, 0x08, 0xF0, 0x0C, 0x10, 0x10, 0x10, 0x10, 0x0C]],  // 'o'
      112: [6, [0xF8, 0x10, 0x08, 0x08, 0x08, 0xF0, 0xFC, 0x08, 0x10, 0x10, 0x10, 0x0C]],  // 'p'
      114: [4, [0xF8, 0x10, 0x08, 0x08, 0x1C, 0x00, 0x00, 0x00]],  // 'r'
      115: [5, [0x30, 0x48, 0x48, 0x48, 0x90, 0x08, 0x10, 0x10, 0x10, 0x0C]],  // 's'
      116: [4, [0x08, 0xFE, 0x08, 0x08, 0x00, 0x1C, 0x10, 0x10]],  // 't'
      117: [6, [0xF8, 0x00, 0x00, 0x00, 0x00, 0xF8, 0x0C, 0x10, 0x10, 0x10, 0x08, 0x1C]],  // 'u'
      119: [9, [0x18, 0xE0, 0x00, 0xE0, 0x18, 0xE0, 0x00, 0xE0, 0x18, 0x00, 0x04, 0x18, 0x04, 0x00, 0x04, 0x18, 0x04, 0x00]],  // 'w'
      120: [6, [0x08, 0x30, 0xC0, 0xC0, 0x30, 0x08, 0x10, 0x0C, 0x00, 0x00, 0x0C, 0x10]],  // 'x'
      121: [7, [0x18, 0x60, 0x80, 0x00, 0x80, 0x60, 0x18, 0x00, 0x80, 0x8C, 0x70, 0x0C, 0x00, 0x00]],  // 'y'
    },
  };

  // ───────────────────────────────────────────────────────────────────────
  // Timing model, in microseconds of simulated time.
  // The firmware never changes the Wire clock, so the OLED runs on the AVR
  // core's 100 kHz default: 9 SCL clocks (8 bits + ACK) per byte.
  // ───────────────────────────────────────────────────────────────────────
  const I2C_BYTE_US = 90;
  const I2C_FRAME_US = 20;     // START + STOP conditions
  const ANALOG_READ_US = 112;  // 13 ADC clocks at 125 kHz, plus call overhead
  const DIGITAL_IO_US = 5;
  const LOOP_MIN_US = 200;     // simulation step: shortest pass through loop()

  const f32 = Math.fround;

  // ───────────────────────────────────────────────────────────────────────
  // Hardware: clock, pins, and the event sink that the browser presents.
  // ───────────────────────────────────────────────────────────────────────
  class Hardware {
    constructor(inputs, sink) {
      this.t = 0;              // simulated time since reset (µs)
      this.inputs = inputs;
      this.sink = sink;
    }
    spend(us) { this.t += us; }
    millis() { return Math.floor(this.t / 1000); }
    analogRead(pin) {
      this.spend(ANALOG_READ_US);
      return this.inputs.analog(pin, this.t);
    }
    digitalRead(pin) {
      this.spend(DIGITAL_IO_US);
      return this.inputs.digital(pin, this.t);
    }
    digitalWrite(pin, value) {
      this.spend(DIGITAL_IO_US);
      this.sink.pin(this.t, pin, value);
    }
    pinMode() {}
    tone(frequency, durationMs) { this.sink.tone(this.t, frequency, durationMs); }
    noTone() { this.sink.noTone(this.t); }
  }

  // ───────────────────────────────────────────────────────────────────────
  // SSD1306AsciiWire::writeDisplay() with OPTIMIZE_I2C, feeding a model of
  // the SSD1306 controller in page addressing mode. RAM writes reach the
  // panel when their I2C transmission ends.
  // ───────────────────────────────────────────────────────────────────────
  const MODE_CMD = 0;
  const MODE_RAM_BUF = 1;

  class I2cOledBus {
    constructor(hw) {
      this.hw = hw;
      this.nData = 0;
      this.txBytes = 0;
      this.pending = [];
      this.page = 0;
      this.col = 0;
      this.decode = true;
    }
    write(b, mode) {
      if (this.nData > 16 || (this.nData && mode === MODE_CMD)) this.end();
      if (this.nData === 0) this.txBytes = 2;  // address byte + control byte
      this.txBytes++;
      if (mode === MODE_RAM_BUF) {
        this.pending.push(this.page, this.col, b);
        this.col = (this.col + 1) & 127;
        this.nData++;
      } else {
        if (this.decode) this.command(b);
        this.end();
      }
    }
    command(b) {
      if (b < 0x10) this.col = (this.col & 0xf0) | b;
      else if (b < 0x20) this.col = (this.col & 0x0f) | ((b & 0x0f) << 4);
      else if ((b & 0xf8) === 0xb0) this.page = b & 7;
    }
    end() {
      this.hw.spend(I2C_FRAME_US + I2C_BYTE_US * this.txBytes);
      const p = this.pending;
      for (let i = 0; i < p.length; i += 3) this.hw.sink.ram(this.hw.t, p[i], p[i + 1], p[i + 2]);
      this.pending = [];
      this.txBytes = 0;
      this.nData = 0;
    }
  }

  // Text that is currently drawn on each text row, used for the accessible
  // description of the canvas. A glyph replaces any glyph it overlaps.
  class OledText {
    constructor() { this.clear(); }
    clear() { this.rows = new Map(); this.version = (this.version || 0) + 1; }
    put(row, c0, c1, ch) {
      const spans = (this.rows.get(row) || []).filter((s) => s.c1 <= c0 || s.c0 >= c1);
      spans.push({ c0, c1, ch });
      spans.sort((a, b) => a.c0 - b.c0);
      this.rows.set(row, spans);
    }
    lines() {
      return [...this.rows.keys()].sort((a, b) => a - b)
        .map((r) => this.rows.get(r).map((s) => s.ch).join('').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // SSD1306Ascii 1.3.5 text rendering (SSD1306Ascii.cpp), configured as the
  // firmware uses it: Adafruit128x64, Arial14, 1x magnification, no invert,
  // INCLUDE_SCROLLING with the default SCROLL_MODE_OFF.
  // ───────────────────────────────────────────────────────────────────────
  const ADAFRUIT128X64_INIT = [
    0xae, 0xd5, 0x80, 0xa8, 0x3f, 0xd3, 0x00, 0x40, 0x8d, 0x14, 0x20, 0x02,
    0xa1, 0xc8, 0xda, 0x12, 0x81, 0x7f, 0xd9, 0xf1, 0xdb, 0x40, 0xa4, 0xa6, 0xaf,
  ];
  const DISPLAY_WIDTH = 128;
  const DISPLAY_ROWS = 8;
  const SCROLL_MODE_OFF = 0;

  class Ssd1306Ascii {
    constructor(bus, text) {
      this.bus = bus;
      this.text = text;
      this.col = 0;
      this.row = 0;
      this.skip = 0;
      this.pageOffset = 0;
      this.scrollMode = SCROLL_MODE_OFF;
      this.font = ARIAL14;
      this.letterSpacing = 1;  // setFont(): proportional fonts get 1 px
    }
    // oled.begin(&Adafruit128x64, OLED_ADDR) → init(dev)
    begin() {
      this.col = 0;
      this.row = 0;
      this.bus.decode = false;  // init arguments are not cursor commands
      for (const b of ADAFRUIT128X64_INIT) this.cmd(b);
      this.bus.decode = true;
      this.clear();
    }
    cmd(b) { this.bus.write(b, MODE_CMD); }
    ramBuf(b) {
      if (this.skip) {
        this.skip--;
      } else if (this.col < DISPLAY_WIDTH) {
        this.bus.write(b, MODE_RAM_BUF);
        this.col++;
      }
    }
    setCol(col) {
      if (col < DISPLAY_WIDTH) {
        this.col = col;
        this.cmd(0x00 | (col & 0x0f));
        this.cmd(0x10 | (col >> 4));
      }
    }
    setRow(row) {
      if (row < DISPLAY_ROWS) {
        this.row = row;
        this.cmd(0xb0 | ((row + this.pageOffset) & 7));
      }
    }
    setCursor(col, row) {
      this.setCol(col);
      this.setRow(row);
    }
    clear() {
      this.pageOffset = 0;
      this.cmd(0x40);  // setStartLine(0)
      this.clearArea(0, DISPLAY_WIDTH - 1, 0, DISPLAY_ROWS - 1);
      this.text.clear();
    }
    clearArea(c0, c1, r0, r1) {
      this.skip = 0;
      if (r1 >= DISPLAY_ROWS) r1 = DISPLAY_ROWS - 1;
      for (let r = r0; r <= r1; r++) {
        this.setCursor(c0, r);
        for (let c = c0; c <= c1; c++) this.ramBuf(0);
      }
      this.setCursor(c0, r0);
    }
    write(ch) {
      const nr = (this.font.height + 7) >> 3;
      if (ch === 13) {
        this.setCol(0);
        return 1;
      }
      if (ch === 10) {
        this.setCol(0);
        const fr = nr;
        const tmpRow = this.row + fr;
        const delta = tmpRow + fr - DISPLAY_ROWS;
        if (this.scrollMode === SCROLL_MODE_OFF || delta <= 0) {
          this.setRow(tmpRow);  // ignored past the last row: the cursor stays put
        }
        return 1;
      }
      const glyph = this.font.glyphs[ch];
      if (!glyph) return 0;  // not in font
      const [w, data] = glyph;
      const s = this.letterSpacing;
      const thieleShift = this.font.height & 7 ? 8 - (this.font.height & 7) : 0;
      const scol = this.col;
      const srow = this.row;
      const skip = this.skip;
      for (let r = 0; r < nr; r++) {
        this.skip = skip;
        if (r) this.setCursor(scol, this.row + 1);
        for (let c = 0; c < w; c++) {
          let b = data[c + r * w];
          if (thieleShift && r + 1 === nr) b >>= thieleShift;
          this.ramBuf(b);
        }
        for (let i = 0; i < s; i++) this.ramBuf(0);
      }
      if (scol < DISPLAY_WIDTH) {
        this.text.put(srow, scol, Math.min(DISPLAY_WIDTH, scol + w + s), String.fromCharCode(ch));
      }
      this.setRow(srow);
      return 1;
    }
    // Arduino Print: write(buffer) stops at the first character that fails
    print(value, digits) {
      const str = typeof value === 'number' && digits !== undefined ? printFloat(value, digits) : String(value);
      for (let i = 0; i < str.length; i++) if (!this.write(str.charCodeAt(i))) break;
    }
    println(value) {
      if (value !== undefined) this.print(value);
      this.print('\r\n');
    }
  }

  // Print::printFloat() from the AVR core, where double is a 32-bit float
  function printFloat(number, digits) {
    number = f32(number);
    if (Number.isNaN(number)) return 'nan';
    if (!Number.isFinite(number)) return 'inf';
    if (number > 4294967040.0 || number < -4294967040.0) return 'ovf';
    let out = '';
    if (number < 0) {
      out += '-';
      number = -number;
    }
    let rounding = f32(0.5);
    for (let i = 0; i < digits; i++) rounding = f32(rounding / 10.0);
    number = f32(number + rounding);
    const intPart = Math.floor(number);
    let remainder = f32(number - intPart);
    out += String(intPart);
    if (digits > 0) out += '.';
    while (digits-- > 0) {
      remainder = f32(remainder * 10.0);
      const toPrint = Math.floor(remainder);
      out += String(toPrint);
      remainder = f32(remainder - toPrint);
    }
    return out;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Firmware: aisaiahcode.ino translated to JavaScript. Functions that call
  // delay() are generators; `yield ms` is delay(ms).
  // ───────────────────────────────────────────────────────────────────────
  const PIN = { JOY_Y: 'A1', JOY_SW: 13, SPEAKER: 2, GREEN: 22, RED: 23, A2: 'A2', A7: 'A7' };
  const HIGH = 1;
  const LOW = 0;

  function createFirmware(hw, oled, random) {
    const green = PIN.GREEN;
    const red = PIN.RED;

    // ---- Menu Items ----
    const menuItems = ['Resistor', 'Diode', 'Capacitor'];
    const MENU_SIZE = menuItems.length;

    // ---- App State Machine ----
    const SCREEN_MENU = 0, SCREEN_LEVEL1 = 1, SCREEN_LEVEL2 = 2, SCREEN_LEVEL3 = 3;
    let screen = SCREEN_MENU;

    // ---- Menu State ----
    let menuIndex = 0;

    // ---- Joystick thresholds ----
    const JOY_DEADZONE = 150;
    const JOY_LOW_TH = 512 - JOY_DEADZONE;
    const JOY_HIGH_TH = 512 + JOY_DEADZONE;

    // ---- Scroll cooldown ----
    const NAV_COOLDOWN_MS = 180;
    let lastNavMs = 0;

    // ---- Button debounce ----
    const DEBOUNCE_MS = 40;
    let btnStable = HIGH;
    let btnLastRead = HIGH;
    let btnLastChangeMs = 0;
    let lastReported = HIGH;  // function-local static in the firmware

    function buttonPressedEvent() {
      const now = hw.millis();
      const raw = hw.digitalRead(PIN.JOY_SW);
      if (raw !== btnLastRead) {
        btnLastRead = raw;
        btnLastChangeMs = now;
      }
      if (now - btnLastChangeMs >= DEBOUNCE_MS) {
        if (btnStable !== raw) {
          btnStable = raw;
          if (btnStable === LOW && lastReported === HIGH) {
            lastReported = LOW;
            return true;
          }
          lastReported = btnStable;
        }
      }
      return false;
    }

    // ---- Sounds ----
    const clickScroll = () => hw.tone(1500, 25);
    const clickSelect = () => hw.tone(2000, 40);

    function* setup() {
      // Wire.begin(); oled.begin(&Adafruit128x64, OLED_ADDR); oled.setFont(Arial14);
      oled.begin();
      oled.clear();
      hw.pinMode(PIN.JOY_SW);
      hw.pinMode(PIN.SPEAKER);
      hw.pinMode(green);
      hw.pinMode(red);
      hw.digitalWrite(green, LOW);
      hw.digitalWrite(red, LOW);
      drawMenu();
    }

    function* loop() {
      switch (screen) {
        case SCREEN_MENU: handleMenuInputs(); break;
        case SCREEN_LEVEL1: yield* runLevel1(); break;
        case SCREEN_LEVEL2: yield* runLevel2(); break;
        case SCREEN_LEVEL3: yield* runLevel3(); break;
      }
    }

    // ---- MENU ----
    function drawMenu() {
      oled.clear();
      oled.println('Menu:');
      for (let i = 0; i < MENU_SIZE; i++) {
        if (i === menuIndex) oled.print('> ');
        else oled.print('  ');
        oled.println(menuItems[i]);
      }
    }

    function handleMenuInputs() {
      const now = hw.millis();
      const y = hw.analogRead(PIN.JOY_Y);
      if (now - lastNavMs >= NAV_COOLDOWN_MS) {
        // Inverted up/down
        if (y < JOY_LOW_TH) {
          menuIndex = (menuIndex + 1) % MENU_SIZE;
          lastNavMs = now;
          clickScroll();
          drawMenu();
        } else if (y > JOY_HIGH_TH) {
          menuIndex = (menuIndex - 1 + MENU_SIZE) % MENU_SIZE;
          lastNavMs = now;
          clickScroll();
          drawMenu();
        }
      }
      if (buttonPressedEvent()) {
        clickSelect();
        if (menuIndex === 0) screen = SCREEN_LEVEL1;
        else if (menuIndex === 1) screen = SCREEN_LEVEL2;
        else if (menuIndex === 2) screen = SCREEN_LEVEL3;
      }
    }

    // ---- LEVEL 1 (Resistor) ----
    const Vo = PIN.A2;
    const L1TargetArray = [f32(1.66), f32(3.58), f32(4.15)];
    let L1Index = 0;
    let L1Target = 0;
    const L1_TOLERANCE = f32(0.1);
    const l1 = { firstRun: true, lastUpdate: 0 };

    function* playSuccessJingle() {
      hw.tone(784, 180); yield 200;
      hw.tone(659, 180); yield 200;
      hw.tone(523, 180); yield 200;
      hw.tone(659, 180); yield 200;
      hw.tone(784, 300); yield 350;
      hw.noTone();
    }

    const readVolts = (pin) => f32(f32(hw.analogRead(pin) * 5.0) / 1023.0);
    const fabs = (x) => (x > 0 ? x : -x);

    function* runLevel1() {
      if (l1.firstRun) {
        hw.analogRead(PIN.A7);  // randomSeed(analogRead(A7))
        L1Index = random(3);    // random(0, 3)
        L1Target = L1TargetArray[L1Index];

        hw.pinMode(Vo);
        hw.digitalWrite(green, LOW);
        hw.digitalWrite(red, LOW);

        oled.clear();
        oled.println('LEVEL 1');
        oled.print('Target: ');
        oled.print(L1Target, 2);
        oled.println(' V');
        oled.println();
        oled.println('Now:    --.--V');
        oled.println();
        oled.println('Press for menu');

        l1.firstRun = false;
      }

      if (hw.millis() - l1.lastUpdate >= 1000) {
        l1.lastUpdate = hw.millis();
        const Vin = readVolts(Vo);

        oled.setCursor(0, 4);
        oled.print('Now:    ');
        oled.print(Vin, 2);
        oled.print('V   ');

        if (fabs(f32(Vin - L1Target)) <= L1_TOLERANCE) {
          hw.digitalWrite(red, LOW);
          hw.digitalWrite(green, HIGH);
          clickSelect();
          oled.clear();
          oled.print('Great job!');
          oled.println();
          yield* playSuccessJingle();
          oled.println('Returning...');
          yield 800;
          hw.digitalWrite(green, LOW);
          l1.firstRun = true;
          screen = SCREEN_MENU;
          drawMenu();
          return;
        }

        if (Vin !== 5) hw.digitalWrite(red, HIGH);
        else hw.digitalWrite(red, LOW);
      }

      if (buttonPressedEvent()) {
        clickSelect();
        hw.digitalWrite(red, LOW);
        l1.firstRun = true;
        screen = SCREEN_MENU;
        drawMenu();
      }
    }

    // ---- LEVEL 2 (Diode) ----
    const L2_PIN = PIN.A2;
    const L2_TARGET = f32(2.68);
    const L2_TOL = f32(0.10);
    const l2 = { firstRun: true, lastUpdate: 0 };

    function* runLevel2() {
      if (l2.firstRun) {
        hw.pinMode(L2_PIN);
        hw.digitalWrite(green, LOW);
        hw.digitalWrite(red, LOW);

        oled.clear();
        oled.println('LEVEL 2');
        oled.print('Target: ');
        oled.print(L2_TARGET, 2);
        oled.println(' V');
        oled.println();
        oled.println('Now:    --.--V');
        oled.println();
        oled.println('Btn=exit');

        l2.firstRun = false;
      }

      if (hw.millis() - l2.lastUpdate >= 1000) {
        l2.lastUpdate = hw.millis();
        const Vin = readVolts(L2_PIN);

        oled.setCursor(0, 4);
        oled.print('Now:    ');
        oled.print(Vin, 2);
        oled.print('V   ');

        if (fabs(f32(Vin - L2_TARGET)) <= L2_TOL) {
          hw.digitalWrite(red, LOW);
          hw.digitalWrite(green, HIGH);
          oled.clear();
          oled.println('GOOD JOB!');
          oled.println();
          oled.println('Returning...');
          yield* playSuccessJingle();
          hw.digitalWrite(green, LOW);
          yield 800;
          l2.firstRun = true;
          screen = SCREEN_MENU;
          drawMenu();
          return;
        }
      }

      if (buttonPressedEvent()) {
        clickSelect();
        hw.digitalWrite(red, LOW);
        l2.firstRun = true;
        screen = SCREEN_MENU;
        drawMenu();
      }
    }

    // ---- LEVEL 3 (Capacitor discharge test, retry on fail) ----
    const L3_PIN = PIN.A2;
    const L3_START_THRESHOLD = f32(2.00);
    const L3_END_THRESHOLD = f32(0.20);
    const L3_WIN_TIME_MS = 500;
    const L3_UPDATE_MS = 500;
    const l3 = { firstRun: true, tStart: 0, lastUpdate: 0, timing: false };

    function L3_showWaiting() {
      oled.clear();
      oled.println('LEVEL 3');
      oled.println('Connect charged cap');
      oled.println('to A2.');
      oled.println();
      oled.println('Waiting for >2.00V...');
    }

    function* runLevel3() {
      if (l3.firstRun) {
        hw.pinMode(L3_PIN);
        hw.digitalWrite(green, LOW);
        hw.digitalWrite(red, LOW);

        L3_showWaiting();

        l3.tStart = 0;
        l3.timing = false;
        l3.firstRun = false;
        return;
      }

      // Allow exit before timing starts
      if (buttonPressedEvent() && !l3.timing) {
        clickSelect();
        l3.firstRun = true;
        screen = SCREEN_MENU;
        drawMenu();
        return;
      }

      const Vin = readVolts(L3_PIN);
      const now = hw.millis();

      // keep red off during wait/timing; only used on fail
      hw.digitalWrite(red, LOW);

      // Wait until capacitor is charged (>2.00 V)
      if (!l3.timing) {
        if (Vin >= L3_START_THRESHOLD) {
          l3.timing = true;
          l3.tStart = now;
          l3.lastUpdate = now;
          oled.clear();
          oled.println('Discharging...');
          oled.println();
          oled.println('t = --- ms');
        }
        return;
      }

      // Timing mode: update screen every 500ms
      if (now - l3.lastUpdate >= L3_UPDATE_MS) {
        l3.lastUpdate = now;
        oled.setCursor(0, 2);
        oled.print('t = ');
        oled.print(now - l3.tStart);
        oled.print(' ms   ');
      }

      // End condition: capacitor discharged below threshold
      if (Vin <= L3_END_THRESHOLD) {
        const total = now - l3.tStart;
        oled.clear();

        if (total > L3_WIN_TIME_MS) {
          hw.digitalWrite(green, HIGH);
          oled.println('GOOD JOB!');
          oled.println();
          oled.print('Time: ');
          oled.print(total);
          oled.println(' ms');
          oled.println();
          oled.println('Returning...');
          yield* playSuccessJingle();
          hw.digitalWrite(green, LOW);

          l3.firstRun = true;
          l3.timing = false;
          screen = SCREEN_MENU;
          drawMenu();
          return;
        }
        hw.digitalWrite(red, HIGH);
        oled.println('Not big cap!');
        oled.println();
        oled.print('Time: ');
        oled.print(total);
        oled.println(' ms');
        oled.println();
        oled.println('Try again...');
        yield 1000;
        hw.digitalWrite(red, LOW);

        l3.tStart = 0;
        l3.timing = false;
        L3_showWaiting();
      }
    }

    return { setup, loop, state: () => ({ screen, menuIndex, L1Target, timing: l3.timing }) };
  }

  // ───────────────────────────────────────────────────────────────────────
  // Machine: runs setup() once, then loop() forever, on the simulated clock.
  // ───────────────────────────────────────────────────────────────────────
  class Machine {
    constructor({ inputs, sink, random }) {
      this.hw = new Hardware(inputs, sink);
      this.text = new OledText();
      this.oled = new Ssd1306Ascii(new I2cOledBus(this.hw), this.text);
      this.firmware = createFirmware(this.hw, this.oled, random);
      this.gen = this.firmware.setup();
      this.inSetup = true;
      this.loopStart = 0;
    }
    // Execute firmware until simulated time passes `target` (µs)
    runUntil(target, maxSteps = 20000) {
      for (let steps = 0; this.hw.t <= target && steps < maxSteps; steps++) {
        const res = this.gen.next();
        if (!res.done) {
          this.hw.spend(res.value * 1000);  // delay(ms)
          continue;
        }
        if (!this.inSetup && this.hw.t - this.loopStart < LOOP_MIN_US) {
          this.hw.t = this.loopStart + LOOP_MIN_US;
        }
        this.inSetup = false;
        this.loopStart = this.hw.t;
        this.gen = this.firmware.loop();
      }
    }
  }

  const core = { Machine, printFloat, ARIAL14, PIN, HIGH, LOW };
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  if (typeof document === 'undefined') return;

  // ═══════════════════════════════════════════════════════════════════════
  // Browser presentation
  // ═══════════════════════════════════════════════════════════════════════
  const $ = (id) => document.getElementById(id);
  const realUs = () => (performance.now() - clockOrigin) * 1000;
  let clockOrigin = performance.now();

  // ---- Audio: one piezo on SPEAKER_PIN, driven like Arduino tone() ----
  // A new tone() replaces the one that is playing; noTone() stops it.
  const buzzer = {
    ctx: null,
    master: null,
    enabled: true,
    current: null,
    voices: new Set(),
    unlock() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.05;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    },
    // Silent until a user gesture has created the context (browser autoplay policy)
    ready() { return this.enabled && this.ctx && this.ctx.state !== 'closed'; },
    // Map a performance.now() timestamp onto the audio clock, a little ahead
    // so that note spacing is exact even when a frame is processed late
    audioTime(perfMs) {
      const ctx = this.ctx;
      // currentTime advances in render quanta, so the largest observed offset
      // is the closest; a large drop means the context was suspended
      const observed = ctx.currentTime - performance.now() / 1000;
      if (this.offset === undefined || observed > this.offset || observed < this.offset - 0.05) this.offset = observed;
      return Math.max(perfMs / 1000 + this.offset + 0.04, ctx.currentTime + 0.005);
    },
    tone(perfMs, frequency, durationMs) {
      if (!this.ready()) return;
      const ctx = this.ctx;
      const start = this.audioTime(perfMs);
      const end = start + durationMs / 1000;
      const ramp = 0.002;  // de-click only; the note length is unchanged
      this.cut(start);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(1, start + ramp);
      gain.gain.setValueAtTime(1, end - ramp);
      gain.gain.linearRampToValueAtTime(0, end);
      osc.connect(gain).connect(this.master);
      osc.start(start);
      osc.stop(end);
      const voice = { osc, gain, end };
      osc.onended = () => {
        gain.disconnect();
        this.voices.delete(voice);
        if (this.current === voice) this.current = null;
      };
      this.voices.add(voice);
      this.current = voice;
    },
    noTone(perfMs) {
      if (this.ready()) this.cut(this.audioTime(perfMs));
    },
    cut(at) {
      const v = this.current;
      if (!v || v.end <= at) return;
      v.gain.gain.cancelScheduledValues(at);
      v.gain.gain.setTargetAtTime(0, at, 0.0008);
      v.osc.stop(at + 0.005);
      v.end = at;
      this.current = null;
    },
    stopAll() {
      for (const v of this.voices) {
        try { v.osc.stop(); } catch (e) { /* already stopped */ }
        v.gain.disconnect();
      }
      this.voices.clear();
      this.current = null;
    },
  };

  // ---- Simulated inputs ----
  // Every change is timestamped, and the firmware reads each input as of its
  // own simulated time, so frame timing in the browser cannot alter behavior.
  class Timeline {
    constructor(value) { this.reset(value); }
    reset(value) { this.items = [[-Infinity, value]]; }
    set(t, value) {
      while (this.items.length > 1 && this.items[this.items.length - 1][0] > t) this.items.pop();
      this.items.push([t, value]);
      if (this.items.length > 64) this.items.splice(1, this.items.length - 64);
    }
    at(t) {
      for (let i = this.items.length - 1; i > 0; i--) if (this.items[i][0] <= t) return this.items[i][1];
      return this.items[0][1];
    }
    last() { return this.items[this.items.length - 1][1]; }
  }

  const ADC_MAX = 1023;
  const BUTTON_MIN_HOLD_US = 60000;  // a tap holds the switch long enough for the 40 ms debounce
  const JOY_MIN_HOLD_US = 30000;
  const input = {
    joyY: new Timeline(512),
    button: new Timeline(HIGH),
    a2: new Timeline({ code: 0 }),  // { code } or { rc: { t0, tau } } for an ideal RC discharge
    a2At(t) {
      const s = this.a2.at(t);
      if (!s.rc) return s.code;
      const v = 5 * Math.exp(-(t - s.rc.t0) / (s.rc.tau * 1000));
      return Math.min(ADC_MAX, Math.floor((v * 1024) / 5));
    },
    analog(pin, t) {
      if (pin === PIN.JOY_Y) return this.joyY.at(t);
      if (pin === PIN.A2) return this.a2At(t);
      return 0;
    },
    digital(pin, t) {
      if (pin === PIN.JOY_SW) return this.button.at(t);
      return HIGH;
    },
    reset() {
      this.joyY.reset(512);
      this.button.reset(HIGH);
      this.a2.reset({ code: 0 });
    },
  };

  // ---- Event sink: OLED RAM and LED pins change at simulated timestamps ----
  const ram = new Uint8Array(8 * 128);
  const leds = { [PIN.GREEN]: LOW, [PIN.RED]: LOW };
  let events = [];
  let eventHead = 0;
  const perfMs = (t) => clockOrigin + t / 1000;
  const sink = {
    ram(t, page, col, value) { events.push(t, 0, page * 128 + col, value); },
    pin(t, pin, value) { events.push(t, 1, pin, value); },
    tone(t, f, d) { buzzer.tone(perfMs(t), f, d); },
    noTone(t) { buzzer.noTone(perfMs(t)); },
  };

  let machine;
  function boot() {
    buzzer.stopAll();
    events = [];
    eventHead = 0;
    ram.fill(0);
    leds[PIN.GREEN] = LOW;
    leds[PIN.RED] = LOW;
    input.reset();
    held.up = held.down = held.button = null;
    for (const el of [btnUp, btnDown, btnSelect]) el.classList.remove('is-pressed');
    clockOrigin = performance.now();
    machine = new Machine({ inputs: input, sink, random: (n) => Math.floor(Math.random() * n) });
    oledDirty = true;
    syncInputUi();
    renderLeds();
  }

  // ---- OLED canvas: 128×64 framebuffer scaled by an integer device-pixel factor ----
  const canvas = $('oled');
  const frame = document.createElement('canvas');
  frame.width = 128;
  frame.height = 64;
  const frameCtx = frame.getContext('2d');
  const frameImage = frameCtx.createImageData(128, 64);
  const screenCtx = canvas.getContext('2d');
  let oledDirty = true;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const avail = canvas.parentElement.clientWidth;
    const devicePx = Math.max(1, Math.min(Math.floor((avail * dpr) / 128), Math.floor(4 * dpr)));
    canvas.width = 128 * devicePx;
    canvas.height = 64 * devicePx;
    canvas.style.width = `${(128 * devicePx) / dpr}px`;
    canvas.style.height = `${(64 * devicePx) / dpr}px`;
    oledDirty = true;
  }

  function drawOled() {
    const px = frameImage.data;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 128; x++) {
        const on = (ram[(y >> 3) * 128 + x] >> (y & 7)) & 1;
        const i = (y * 128 + x) * 4;
        const v = on ? 255 : 0;
        px[i] = v; px[i + 1] = v; px[i + 2] = v; px[i + 3] = 255;
      }
    }
    frameCtx.putImageData(frameImage, 0, 0);
    screenCtx.imageSmoothingEnabled = false;
    screenCtx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    oledDirty = false;
  }

  // ---- LEDs ----
  const ledUi = {
    [PIN.GREEN]: { el: $('led-green'), state: $('led-green-state'), name: 'Green LED' },
    [PIN.RED]: { el: $('led-red'), state: $('led-red-state'), name: 'Red LED' },
  };
  function renderLeds(changedPin) {
    for (const pin of [PIN.GREEN, PIN.RED]) {
      const on = leds[pin] === HIGH;
      ledUi[pin].el.classList.toggle('is-on', on);
      ledUi[pin].state.textContent = on ? 'on' : 'off';
    }
    if (changedPin !== undefined) {
      announce(`${ledUi[changedPin].name} ${leds[changedPin] === HIGH ? 'on' : 'off'}.`);
    }
  }

  // ---- Accessible text ----
  const status = $('sim-status');
  const oledText = $('oled-text');
  let seenVersion = -1;
  let changedAt = 0;
  let announcedVersion = -1;
  let lastDescribe = 0;
  let pendingAnnounce = [];
  function announce(msg) { pendingAnnounce.push(msg); }
  function updateAccessibleText(now) {
    const text = machine.text;
    if (text.version !== seenVersion) {
      seenVersion = text.version;
      changedAt = now;
    }
    // A cleared and redrawn screen is announced once that redraw has reached
    // the panel; later in-place updates (timer, live voltage) do not hold it back
    const redrawPending = eventHead < events.length && events[eventHead] < changedAt + 350000;
    if (announcedVersion !== seenVersion && now - changedAt > 150000 && !redrawPending) {
      announcedVersion = seenVersion;
      const lines = text.lines();
      announce(`Display: ${lines.join('. ')}.`);
      oledText.textContent = lines.join(' / ');
      lastDescribe = now;
    }
    // In-place updates (live voltage, timer) refresh the description, not the live region
    if (now - lastDescribe > 1000000) {
      oledText.textContent = text.lines().join(' / ');
      lastDescribe = now;
    }
    if (pendingAnnounce.length) {
      status.textContent = pendingAnnounce.join(' ');
      pendingAnnounce = [];
    }
  }

  // ---- Main loop ----
  function tick() {
    let now = realUs();
    // A hidden tab pauses the simulation instead of fast-forwarding it
    if (now - machine.hw.t > 250000) {
      clockOrigin += (now - machine.hw.t) / 1000;
      now = realUs();
    }
    machine.runUntil(now);
    while (eventHead < events.length && events[eventHead] <= now) {
      const kind = events[eventHead + 1];
      const a = events[eventHead + 2];
      const v = events[eventHead + 3];
      if (kind === 0) {
        if (ram[a] !== v) { ram[a] = v; oledDirty = true; }
      } else if (leds[a] !== v) {
        leds[a] = v;
        renderLeds(a);
      }
      eventHead += 4;
    }
    if (eventHead > 40000) {
      events = events.slice(eventHead);
      eventHead = 0;
    }
    if (oledDirty) drawOled();
    if (input.a2.last().rc) syncInputUi();
    updateAccessibleText(now);
    requestAnimationFrame(tick);
  }

  // ---- Controls ----
  const board = $('board');
  const btnUp = $('joy-up');
  const btnDown = $('joy-down');
  const btnSelect = $('joy-select');

  // Press start times; a release is recorded no earlier than the minimum hold
  const held = { up: null, down: null, button: null };
  const JOY_VALUE = { up: ADC_MAX, down: 0 };  // firmware: y > 662 moves up, y < 362 moves down

  function joystick(dir, down) {
    const now = realUs();
    const other = dir === 'up' ? 'down' : 'up';
    if (down) {
      if (held[dir] !== null) return;
      held[dir] = now;
      input.joyY.set(now, JOY_VALUE[dir]);
    } else {
      if (held[dir] === null) return;
      input.joyY.set(Math.max(now, held[dir] + JOY_MIN_HOLD_US), held[other] !== null ? JOY_VALUE[other] : 512);
      held[dir] = null;
    }
    (dir === 'up' ? btnUp : btnDown).classList.toggle('is-pressed', down);
  }
  function button(down) {
    const now = realUs();
    if (down) {
      if (held.button !== null) return;
      held.button = now;
      input.button.set(now, LOW);
    } else {
      if (held.button === null) return;
      input.button.set(Math.max(now, held.button + BUTTON_MIN_HOLD_US), HIGH);
      held.button = null;
    }
    btnSelect.classList.toggle('is-pressed', down);
  }

  let lastPhysicalPress = 0;
  function bindHold(el, onChange) {
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      buzzer.unlock();
      el.focus({ preventScroll: true });
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* pointer already released */ }
      lastPhysicalPress = performance.now();
      onChange(true);
    });
    const release = () => { if (el.classList.contains('is-pressed')) onChange(false); };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    // Activation without pointer or keys (e.g. assistive technology): a short tap
    el.addEventListener('click', (e) => {
      if (performance.now() - lastPhysicalPress < 600) return;
      buzzer.unlock();
      onChange(true);
      setTimeout(() => onChange(false), 80);
    });
  }
  bindHold(btnUp, (d) => joystick('up', d));
  bindHold(btnDown, (d) => joystick('down', d));
  bindHold(btnSelect, button);

  const keyMap = { ArrowUp: (d) => joystick('up', d), ArrowDown: (d) => joystick('down', d), Enter: button, ' ': button };
  board.addEventListener('keydown', (e) => {
    const act = keyMap[e.key];
    if (!act) return;
    e.preventDefault();
    if (e.repeat) return;
    buzzer.unlock();
    lastPhysicalPress = performance.now();
    act(true);
  });
  board.addEventListener('keyup', (e) => {
    const act = keyMap[e.key];
    if (!act) return;
    e.preventDefault();
    lastPhysicalPress = performance.now();
    act(false);
  });
  board.addEventListener('focusout', (e) => {
    if (board.contains(e.relatedTarget)) return;
    joystick('up', false);
    joystick('down', false);
    button(false);
  });

  // A2 voltage slider and the ideal RC discharge helper
  const a2Slider = $('a2');
  const a2Out = $('a2-out');
  const tauSlider = $('tau');
  const tauOut = $('tau-out');
  const rcButton = $('rc-connect');

  function syncInputUi() {
    const now = realUs();
    const code = input.a2At(now);
    if (input.a2.last().rc && code === 0) input.a2.set(now, { code: 0 });  // fully discharged
    const rc = Boolean(input.a2.last().rc);
    a2Slider.value = String(code);
    const volts = printFloat(f32(f32(code * 5.0) / 1023.0), 2);
    a2Out.textContent = `${volts} V · ADC ${code}`;
    a2Slider.setAttribute('aria-valuetext', `${volts} volts, ADC code ${code}`);
    rcButton.textContent = rc ? 'Disconnect capacitor' : 'Connect charged capacitor';
    rcButton.setAttribute('aria-pressed', String(rc));
  }
  function setA2(code) {
    input.a2.set(realUs(), { code: Math.max(0, Math.min(ADC_MAX, code)) });
    syncInputUi();
  }
  a2Slider.addEventListener('input', () => setA2(Number(a2Slider.value)));
  $('a2-dec').addEventListener('click', () => setA2(Number(a2Slider.value) - 1));
  $('a2-inc').addEventListener('click', () => setA2(Number(a2Slider.value) + 1));
  tauSlider.addEventListener('input', () => { tauOut.textContent = `${tauSlider.value} ms`; });
  rcButton.addEventListener('click', () => {
    const now = realUs();
    if (input.a2.last().rc) input.a2.set(now, { code: input.a2At(now) });
    else input.a2.set(now, { rc: { t0: now, tau: Number(tauSlider.value) } });
    syncInputUi();
  });

  // Sound and reset
  const soundButton = $('sound');
  soundButton.addEventListener('click', () => {
    buzzer.enabled = !buzzer.enabled;
    if (buzzer.enabled) buzzer.unlock();
    else buzzer.stopAll();
    soundButton.textContent = `Sound: ${buzzer.enabled ? 'On' : 'Off'}`;
    soundButton.setAttribute('aria-pressed', String(buzzer.enabled));
  });
  $('reset').addEventListener('click', () => {
    boot();
    announce('Simulator reset.');
  });
  document.addEventListener('pointerdown', () => buzzer.unlock(), { once: true });
  document.addEventListener('keydown', () => buzzer.unlock(), { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) buzzer.stopAll(); });

  if ('ResizeObserver' in window) new ResizeObserver(fitCanvas).observe(canvas.parentElement);
  else window.addEventListener('resize', fitCanvas);
  fitCanvas();
  tauOut.textContent = `${tauSlider.value} ms`;
  boot();
  requestAnimationFrame(tick);
})();
