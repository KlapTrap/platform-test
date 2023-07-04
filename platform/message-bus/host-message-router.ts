import { Observable, Subject, filter } from "rxjs";

interface BaseMessage {
  type: string;
}

interface ExpectsResponseMessage {
  id?: string;
}

interface VersionedMessage {
  version?: string;
}

interface PayloadMessage {
  payload?:
    | Record<string | number, string | number | symbol>
    | string
    | number
    | symbol;
}

type ResponseMessage = BaseMessage &
  Required<ExpectsResponseMessage> &
  PayloadMessage;

type Message = BaseMessage &
  ExpectsResponseMessage &
  VersionedMessage &
  PayloadMessage;

class MessagePackage {
  public claimContext: Pick<Message, "type" | "version">;
  private isClamed = false;
  claim() {
    if (this.isClamed) return null;
    this.isClamed = true;
    return this.message;
  }
  isClaimed() {
    return this.isClamed;
  }
  constructor(private message: Message) {
    this.claimContext = {
      type: message.type,
      version: message.version,
    };
  }
}

class ResponsePackage {
  constructor(
    public readonly payload: PayloadMessage["payload"],
    public messagePackage: MessagePackage,
    public message: Message
  ) {}
}

class MessageBus {
  messages$ = new Subject<MessagePackage | ResponsePackage>();

  push(messagePackage: MessagePackage | ResponsePackage) {
    this.messages$.next(messagePackage);
  }

  listenToResponses() {
    return this.messages$.pipe(
      filter((m) => m instanceof ResponsePackage)
    ) as Observable<ResponsePackage>;
  }
  listenToMessages() {
    return this.messages$.pipe(
      filter((m) => m instanceof MessagePackage && !m.isClaimed())
    ) as Observable<MessagePackage>;
  }
}
const messageBus = new MessageBus();

class ResponseQueue {
  readonly queue = new WeakMap<
    MessagePackage,
    { iframe: HTMLIFrameElement; origin: string }
  >();
}

const responseQueue = new ResponseQueue();

messageBus.listenToResponses().subscribe((resPackage) => {
  const queueContext = responseQueue.queue.get(resPackage.messagePackage);
  if (queueContext) {
    const { message } = resPackage;
    sendMessageToIframe(queueContext.iframe, queueContext.origin, {
      id: message.id as string,
      type: message.type as string,
      payload: resPackage.payload,
    });
  }
});

const sendMessageToIframe = (
  iframe: HTMLIFrameElement,
  origin: string,
  message: ResponseMessage
) => {
  iframe.contentWindow?.postMessage(message, origin);
};

class MessageSenderRegistry {
  private messageSenders = new Map<string, Set<HTMLIFrameElement>>();
  add(iframe: HTMLIFrameElement) {
    const origin = new URL(iframe.src).origin;
    if (this.messageSenders.has(origin)) {
      this.messageSenders.get(origin)?.add(iframe);
    } else {
      this.messageSenders.set(origin, new Set([iframe]));
    }
  }
  get(origin: string) {
    return this.messageSenders.get(origin);
  }
}
const messageSenderRegistry = new MessageSenderRegistry();

window.addEventListener("message", (event) => {
  const messagePackage = new MessagePackage(event.data);
  const matchedEventOrigin = messageSenderRegistry.get(event.origin);
  if (!matchedEventOrigin) return;
  const matchedIframe = Array.from(matchedEventOrigin).find(
    (iframe) => iframe.contentWindow === event.source
  );

  if (matchedIframe && event.data.id) {
    responseQueue.queue.set(messagePackage, {
      iframe: matchedIframe,
      origin: event.origin,
    });
    messageBus.push(messagePackage);
  }
});

export { messageBus, messageSenderRegistry, MessagePackage, ResponsePackage };
