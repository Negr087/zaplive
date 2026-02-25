import {
  nostrNotes,
  seenEvents,
  zaps,
  zapraisers,
  zapsPerNote,
  profiles,
  relayEvents,
  totalsPerNote,
  totalsPerRecipient,
  totalsPerSender,
  totalsPerZapper
} from "$lib/store";

import { SimplePool } from "nostr-tools";
import { calculateZapriserAmount } from "$lib/utils";
import { eventToZap } from "$lib/nostr/utils";

export default class Nostr {
  constructor() {
    this.pool = new SimplePool();

    this.relays = [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.snort.social",
      "wss://relay.primal.net",
      "wss://nostr.mom"
    ];

    this.subscriptions = {};
    this.delayedSubscriptions = {};
  }

  // =============================
  // SUBSCRIBE
  // =============================

  subscribe(filters, closeAfter = 2000) {
    const sub = this.pool.sub(this.relays, filters);

    sub.on("event", (event) => {
      this.processEvent(event);
    });

    sub.on("eose", () => {
      if (closeAfter) {
        setTimeout(() => sub.close(), closeAfter);
      }
    });

    return sub;
  }

  unsubscribe(sub) {
    if (sub) sub.close();
  }

  unsubscribeAll() {
    Object.values(this.subscriptions).forEach((sub) => {
      sub.close();
    });
    this.subscriptions = {};
  }

  // =============================
  // RESET
  // =============================

  async reset() {
    zaps.set([]);
    seenEvents.set({});
    zapsPerNote.set({});
    totalsPerNote.set({});
    totalsPerSender.set({});
    totalsPerRecipient.set({});
    totalsPerZapper.set({});
  }

  // =============================
  // PROCESS EVENT
  // =============================

  async processEvent(event) {
    let existingEvent = false;

    seenEvents.update((events) => {
      if (events[event.id]) {
        existingEvent = true;
        return events;
      }
      events[event.id] = true;
      return events;
    });

    if (existingEvent) return;

    switch (event.kind) {
      case 9734:
      case 9735:
        this.processZap(event);
        break;

      case 0:
        this.processMetadata(event);
        break;

      case 1:
        this.processNote(event);
        break;
    }
  }

  // =============================
  // ZAPS
  // =============================

  processZap(event) {
    const zap = eventToZap(event, profiles);
    if (!zap) return;

    zaps.update((z) => {
      z.unshift(zap);
      return z;
    });

    // Totals per note
    totalsPerNote.update((totals) => {
      const t = totals[zap.zappedNoteId] || { count: 0, amount: 0 };
      t.count++;
      t.amount += zap.amount;
      totals[zap.zappedNoteId] = t;
      return totals;
    });

    // Totals per sender
    totalsPerSender.update((totals) => {
      const t = totals[zap.sender] || { count: 0, amount: 0 };
      t.count++;
      t.amount += zap.amount;
      totals[zap.sender] = t;
      return totals;
    });

    // Totals per recipient
    totalsPerRecipient.update((totals) => {
      const t = totals[zap.recipient] || { count: 0, amount: 0 };
      t.count++;
      t.amount += zap.amount;
      totals[zap.recipient] = t;
      return totals;
    });

    if (zap.zapper) {
      totalsPerZapper.update((totals) => {
        const t = totals[zap.zapper] || { count: 0, amount: 0 };
        t.count++;
        t.amount += zap.amount;
        totals[zap.zapper] = t;
        return totals;
      });
    }
  }

  // =============================
  // METADATA
  // =============================

  processMetadata(event) {
    try {
      const content = JSON.parse(event.content);

      profiles.update((p) => {
        p[event.pubkey] = {
          ...p[event.pubkey],
          ...content
        };
        return p;
      });
    } catch {
      return;
    }
  }

  // =============================
  // NOTES
  // =============================

  processNote(event) {
    nostrNotes.update((notes) => {
      notes[event.id] = event;
      return notes;
    });

    const isZapraiser = event.tags?.some(
      (t) => t[0] === "t" && t[1] === "zapraiser"
    );

    if (isZapraiser) {
      zapraisers.update((z) => {
        z.push(event.id);
        return z;
      });

      this.delayedSubscribe([{ "#e": [event.id] }], "zapraiser", 1000);
    }
  }

  // =============================
  // DELAYED SUBSCRIBE
  // =============================

  delayedSubscribe(filters, name, delay, closeAfter = 2000) {
    if (!this.delayedSubscriptions[name]) {
      this.delayedSubscriptions[name] = [];
    }

    filters.forEach((f) => {
      this.delayedSubscriptions[name].push(f);
    });

    setTimeout(() => {
      this.subscribe(this.delayedSubscriptions[name], closeAfter);
      delete this.delayedSubscriptions[name];
    }, delay);
  }

  // =============================
  // REQUESTS
  // =============================

  reqEvent(eventId) {
    this.subscribe([{ ids: [eventId] }]);
  }

  reqProfile(pubkeys) {
    const list = Array.isArray(pubkeys) ? pubkeys : [pubkeys];
    this.subscribe([{ kinds: [0], authors: list }], 2000);
  }
}