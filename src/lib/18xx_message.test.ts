import { describe, it, expect } from 'vitest';
import { Parsed18xxMessage } from "./18xx_message";

const event =
  '{"text":"<@123456789> Your Turn in 1836Jr30 \\"Test game\\" (Auction Round 1)\\nhttp://18xx.games/game/1234"}';

const emptyMessage = {
  userId: undefined,
  text: undefined,
  title: undefined,
  description: undefined,
  round: undefined,
  turn: undefined,
  link: undefined,
  valid: false,
};

test("does nothing if text is empty", () => {
  const message = new Parsed18xxMessage({ text: "" });

  expect(message).toEqual(emptyMessage);
});

test("does nothing if text does not match", () => {
  const message = new Parsed18xxMessage({ text: "asdasdasd" });

  expect(message).toEqual(emptyMessage);
});

test("does nothing if input is empty", () => {
  const message = new Parsed18xxMessage(JSON.parse('""'));

  expect(message).toEqual(emptyMessage);
});

test("does nothing if input has no property", () => {
  const message = new Parsed18xxMessage(JSON.parse("{}"));

  expect(message).toEqual(emptyMessage);
});

test("parses message", () => {
  const message = new Parsed18xxMessage(JSON.parse(event));

  expect(message).toEqual({
    userId: "123456789",
    text: "Your Turn",
    title: "1836Jr30",
    description: "Test game",
    round: "Auction Round",
    turn: 1,
    link: "http://18xx.games/game/1234",
    valid: true,
  });
});

test("parses 18ZOO message", () => {
  const message = new Parsed18xxMessage({
    text: '<@Hello> Your Turn in 18ZOO - Map A "test zoo" (SR-day 1)\nhttp://18xx.games/game/59585',
  });

  expect(message.valid).toBeTruthy();
});

test("formats message text back to original", () => {
  const message = new Parsed18xxMessage(JSON.parse(event));

  expect(message.toString()).toBe(
    'Your Turn in 1836Jr30 "Test game" (Auction Round 1)'
  );
});

test("formats empty message to nothing", () => {
  const message = new Parsed18xxMessage({ text: "" });

  expect(message.toString()).toBe("");
});
