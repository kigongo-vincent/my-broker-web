import * as flatbuffers from 'flatbuffers';
import { ApiPayload } from './fbs/mybroker/api-payload';
import { AuthOk } from './fbs/mybroker/auth-ok';
import { ChatDetail } from './fbs/mybroker/chat-detail';
import { ChatMsg } from './fbs/mybroker/chat-msg';
import { ChatRow } from './fbs/mybroker/chat-row';
import { ChatRowList } from './fbs/mybroker/chat-row-list';
import { ChatsAndFavs } from './fbs/mybroker/chats-and-favs';
import { Envelope } from './fbs/mybroker/envelope';
import { NestedPostT } from './fbs/mybroker/nested-post-t';
import { NestedUser } from './fbs/mybroker/nested-user';
import { PostList } from './fbs/mybroker/post-list';
import { PostLocationList } from './fbs/mybroker/post-location-list';
import { PostLocationRow } from './fbs/mybroker/post-location-row';
import { PostPage } from './fbs/mybroker/post-page';
import { PostWire } from './fbs/mybroker/post-wire';
import { Price } from './fbs/mybroker/price';
import { Location } from './fbs/mybroker/location';
import { User } from './fbs/mybroker/user';
import { UsersList } from './fbs/mybroker/users-list';

function str(s: string | null | undefined): string {
  return s ?? '';
}

function numRoom(s: string): number {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

function decodePrice(p: Price | null): { currency: string; amount: number } {
  if (!p) return { currency: '', amount: 0 };
  return { currency: str(p.currency()), amount: p.amount() };
}

function decodeLocation(l: Location | null): { lat: number; lon: number; name: string } {
  if (!l) return { lat: 0, lon: 0, name: '' };
  return { lat: l.lat(), lon: l.lon(), name: str(l.name()) };
}

export function decodeUser(u: User | null): Record<string, unknown> {
  if (!u) {
    return {
      id: 0,
      ID: 0,
      name: '',
      fullName: '',
      phone_number: '',
      phone: '',
      photo: '',
      avatar: '',
      email: '',
      last_seen: '',
      lastSeen: '',
      status: '',
      verified: '',
      show_contact: true,
      is_broker: false,
      broker_fees: '',
      accepted_ps: false,
      size: '',
    };
  }
  const id = u.id();
  const nameStr = str(u.name());
  return {
    id,
    ID: id,
    name: nameStr,
    fullName: nameStr,
    phone_number: str(u.phoneNumber()),
    phone: str(u.phoneNumber()),
    photo: str(u.photo()),
    avatar: str(u.photo()),
    email: str(u.email()),
    last_seen: str(u.lastSeen()),
    lastSeen: str(u.lastSeen()),
    status: str(u.status()),
    verified: str(u.verified()),
    show_contact: u.showContact(),
    is_broker: u.isBroker(),
    broker_fees: str(u.brokerFees()),
    accepted_ps: u.acceptedPs(),
    size: '',
  };
}

function nestedUserToClient(n: NestedUser | null): Record<string, unknown> {
  if (!n) return decodeUser(null) as Record<string, unknown>;
  const id = n.id();
  const nameStr = str(n.name());
  return {
    id,
    ID: id,
    name: nameStr,
    fullName: nameStr,
    phone_number: str(n.phoneNumber()),
    phone: str(n.phoneNumber()),
    photo: str(n.photo()),
    avatar: str(n.photo()),
    email: str(n.email()),
    last_seen: str(n.lastSeen()),
    lastSeen: str(n.lastSeen()),
    status: str(n.status()),
    verified: str(n.verified()),
    show_contact: n.showContact(),
    size: '',
  };
}

function decodeImages(t: { imagesLength(): number; images(index: number): string | null }): string[] {
  const n = t.imagesLength();
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(str(t.images(i)));
  }
  return out;
}

export function decodePostWire(pw: PostWire | null): Record<string, unknown> {
  if (!pw) {
    return { ID: 0, id: 0, images: [], likers: [], price: { Currency: '', Amount: 0 }, location: { Name: '', Lat: 0, Lon: 0 } };
  }
  const pid = pw.id();
  const pr = decodePrice(pw.price());
  const loc = decodeLocation(pw.location());
  const likers: Record<string, unknown>[] = [];
  for (let i = 0; i < pw.likersLength(); i++) {
    const lu = pw.likers(i);
    if (lu) likers.push(decodeUser(lu));
  }
  return {
    ID: pid,
    id: pid,
    user_id: pw.userId(),
    type: str(pw.type()),
    price: { Currency: pr.currency, Amount: pr.amount },
    location: { Name: loc.name, Lat: loc.lat, Lon: loc.lon },
    is_liked: false,
    is_negotiable: pw.isNegotiable(),
    is_available: pw.isAvailable(),
    bedrooms: numRoom(str(pw.bedrooms())),
    bathrooms: numRoom(str(pw.bathrooms())),
    toilets: numRoom(str(pw.toilets())),
    images: decodeImages(pw),
    amenities: str(pw.amenities()),
    pay_water_bills: pw.payWaterBills(),
    pay_electricity_bills: pw.payElectricityBills(),
    pay_for_trash: pw.payForTrash(),
    has_parking: pw.hasParking(),
    required_first_months_paid: pw.requiredFirstMonthsPaid(),
    units: str(pw.units()),
    is_approved: pw.isApproved(),
    review_disclaimer_agreed: pw.reviewDisclaimerAgreed(),
    likers,
    user: decodeUser(pw.user()),
    author: decodeUser(pw.user()),
    hideUserInfo: false,
    selected: false,
  };
}

function decodeNestedPost(np: NestedPostT | null): Record<string, unknown> {
  if (!np) return {};
  const pid = np.id();
  const pr = decodePrice(np.price());
  const loc = decodeLocation(np.location());
  const likers: Record<string, unknown>[] = [];
  for (let i = 0; i < np.likersLength(); i++) {
    const x = np.likers(i);
    if (x) likers.push(nestedUserToClient(x));
  }
  return {
    ID: pid,
    id: pid,
    type: str(np.type()),
    price: { Currency: pr.currency, Amount: pr.amount },
    location: { Name: loc.name, Lat: loc.lat, Lon: loc.lon },
    is_liked: np.isLiked(),
    is_negotiable: np.isNegotiable(),
    is_available: np.isAvailable(),
    bedrooms: numRoom(str(np.bedrooms())),
    bathrooms: numRoom(str(np.bathrooms())),
    toilets: numRoom(str(np.toilets())),
    images: decodeImages(np),
    author: nestedUserToClient(np.author()),
    user: nestedUserToClient(np.user()),
    likers,
    hideUserInfo: np.hideUserInfo(),
    hide_user_info: np.hideUserInfo(),
    selected: np.selected(),
  };
}

function decodePostPage(pp: PostPage): { posts: Record<string, unknown>[]; total: number; page: number; limit: number } {
  const posts: Record<string, unknown>[] = [];
  for (let i = 0; i < pp.postsLength(); i++) {
    const p = pp.posts(i);
    if (p) posts.push(decodePostWire(p));
  }
  return {
    posts,
    total: Number(pp.total()),
    page: pp.page(),
    limit: pp.limit(),
  };
}

function decodePostList(pl: PostList): Record<string, unknown>[] {
  const posts: Record<string, unknown>[] = [];
  for (let i = 0; i < pl.postsLength(); i++) {
    const p = pl.posts(i);
    if (p) posts.push(decodePostWire(p));
  }
  return posts;
}

function decodePostLocationList(pll: PostLocationList): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < pll.itemsLength(); i++) {
    const r = pll.items(i) as PostLocationRow | null;
    if (!r) continue;
    rows.push({
      id: r.id(),
      latitude: r.latitude(),
      longitude: r.longitude(),
      title: str(r.title()),
      price: str(r.price()),
      address: str(r.address()),
    });
  }
  return rows;
}

function decodeChatRow(cr: ChatRow | null): Record<string, unknown> {
  if (!cr) {
    return { id: 0, user: decodeUser(null), lastMessage: '', last_message: '', newMessages: 0 };
  }
  const lm = str(cr.lastMessage());
  return {
    id: cr.id(),
    user: decodeUser(cr.user()),
    lastMessage: lm,
    last_message: lm,
    newMessages: cr.newMessages(),
  };
}

function decodeChatRowList(crl: ChatRowList): Record<string, unknown>[] {
  const chats: Record<string, unknown>[] = [];
  for (let i = 0; i < crl.chatsLength(); i++) {
    const c = crl.chats(i);
    if (c) chats.push(decodeChatRow(c));
  }
  return chats;
}

function decodeChatMsg(cm: ChatMsg | null): Record<string, unknown> {
  if (!cm) return {};
  const post = cm.post();
  const img = str(cm.image());
  const ms = Number(cm.createdAtUnixMs());
  const createdAt = Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
  return {
    id: cm.id(),
    content: {
      text: str(cm.text()),
      image: img || undefined,
      post: post ? decodePostWire(post) : undefined,
    },
    createdAt,
    seenByRecipient: cm.seenByRecipient(),
    isOwnedByRecipient: cm.isOwnedByRecipient(),
  };
}

function decodeChatDetail(cd: ChatDetail): Record<string, unknown> {
  const messages: Record<string, unknown>[] = [];
  for (let i = 0; i < cd.messagesLength(); i++) {
    const m = cd.messages(i);
    if (m) messages.push(decodeChatMsg(m));
  }
  const rid = cd.id();
  return {
    id: rid,
    room_id: rid,
    user: decodeUser(cd.user()),
    messages,
  };
}

export interface DecodedEnvelope {
  msg: string;
  content: unknown;
  data: unknown;
  /** Pagination metadata when payload is PostPage. */
  limit?: number;
  total?: number;
  /** Response page index when payload is PostPage (distinct from HTTP paging helpers). */
  apiPage?: number;
  token?: string;
  otp?: number;
  warning?: string;
}

/** Parse API `Envelope` bytes into plain objects (snake_case where it matches prior JSON fields). */
export function decodeEnvelopeBuffer(ab: ArrayBuffer): DecodedEnvelope {
  const bb = new flatbuffers.ByteBuffer(new Uint8Array(ab));
  const env = Envelope.getRootAsEnvelope(bb);
  const msg = str(env.msg());
  const token = env.token() ?? undefined;
  const otp = env.otp() || undefined;
  const warning = env.warning() ?? undefined;
  const pt = env.payloadType();

  let content: unknown;
  let limit: number | undefined;
  let total: number | undefined;
  let apiPage: number | undefined;

  switch (pt) {
    case ApiPayload.Empty:
      content = undefined;
      break;
    case ApiPayload.PostPage: {
      const pp = env.payload(new PostPage()) as PostPage | null;
      if (!pp) {
        content = [];
        limit = 0;
        total = 0;
        apiPage = 1;
      } else {
        const page = decodePostPage(pp);
        content = page.posts;
        limit = page.limit;
        total = page.total;
        apiPage = page.page;
      }
      break;
    }
    case ApiPayload.PostList: {
      const pl = env.payload(new PostList()) as PostList | null;
      content = pl ? decodePostList(pl) : [];
      break;
    }
    case ApiPayload.NestedPostT: {
      const np = env.payload(new NestedPostT()) as NestedPostT | null;
      content = decodeNestedPost(np);
      break;
    }
    case ApiPayload.PostLocationList: {
      const pll = env.payload(new PostLocationList()) as PostLocationList | null;
      content = pll ? decodePostLocationList(pll) : [];
      break;
    }
    case ApiPayload.ChatRowList: {
      const crl = env.payload(new ChatRowList()) as ChatRowList | null;
      content = crl ? decodeChatRowList(crl) : [];
      break;
    }
    case ApiPayload.ChatDetail: {
      const cd = env.payload(new ChatDetail()) as ChatDetail | null;
      content = cd ? decodeChatDetail(cd) : { room_id: 0, user: decodeUser(null), messages: [] };
      break;
    }
    case ApiPayload.ChatsAndFavs: {
      const cf = env.payload(new ChatsAndFavs()) as ChatsAndFavs | null;
      content = cf
        ? { chats: cf.unreadTotal(), favourites: cf.favourites() }
        : { chats: 0, favourites: 0 };
      break;
    }
    case ApiPayload.AuthOk: {
      const ao = env.payload(new AuthOk()) as AuthOk | null;
      const u = ao?.user() ?? null;
      content = decodeUser(u);
      break;
    }
    case ApiPayload.UsersList: {
      const ul = env.payload(new UsersList()) as UsersList | null;
      const users: Record<string, unknown>[] = [];
      if (ul) {
        for (let i = 0; i < ul.usersLength(); i++) {
          const u = ul.users(i);
          if (u) users.push(decodeUser(u));
        }
      }
      content = users;
      break;
    }
    default:
      content = undefined;
  }

  return {
    msg,
    content,
    data: content,
    limit,
    total,
    apiPage,
    token,
    otp,
    warning,
  };
}
