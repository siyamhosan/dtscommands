import { Message } from "discord.js";

export const del3 = (msg: Message) => {
  setTimeout(() => {
    msg.delete().catch(() => null);
  }, 3000);
};

export const del5 = (msg: Message) => {
  setTimeout(() => {
    msg.delete().catch(() => null);
  }, 5000);
};

export const del9 = (msg: Message) => {
  setTimeout(() => {
    msg.delete().catch(() => null);
  }, 9000);
};

export const del25 = (msg: Message) => {
  setTimeout(() => {
    msg.delete().catch(() => null);
  }, 25000);
};

export const del30 = (msg: Message) => {
  setTimeout(() => {
    msg.delete().catch(() => null);
  }, 30000);
};

export const del60 = (msg: Message) => {
  setTimeout(() => {
    msg.delete().catch(() => null);
  }, 60000);
};

export const del80 = (msg: Message) => {
  setTimeout(() => {
    msg.delete().catch(() => null);
  }, 80000);
};
