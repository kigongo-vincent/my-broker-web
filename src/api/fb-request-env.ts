import * as flatbuffers from 'flatbuffers';
import { ApprovePostBody } from './fbs/mybroker/approve-post-body';
import { ApproveUserBody } from './fbs/mybroker/approve-user-body';
import { BlockBody } from './fbs/mybroker/block-body';
import { CreatePostBody } from './fbs/mybroker/create-post-body';
import { EmptyReq } from './fbs/mybroker/empty-req';
import { GoogleAuthBody } from './fbs/mybroker/google-auth-body';
import { Location } from './fbs/mybroker/location';
import { PhonePinBody } from './fbs/mybroker/phone-pin-body';
import { PostIdBody } from './fbs/mybroker/post-id-body';
import { Price } from './fbs/mybroker/price';
import { ReportBody } from './fbs/mybroker/report-body';
import { ReqPayload } from './fbs/mybroker/req-payload';
import { RequestEnv } from './fbs/mybroker/request-env';
import { RoomIdBody } from './fbs/mybroker/room-id-body';
import { SignInPhone } from './fbs/mybroker/sign-in-phone';
import { UpdateIdBody } from './fbs/mybroker/update-id-body';
import { UpdateProfileBody } from './fbs/mybroker/update-profile-body';
import { VerifyOtpBody } from './fbs/mybroker/verify-otp-body';

export const FB_CONTENT_TYPE = 'application/x-flatbuffer';

function finishRequest(
  b: flatbuffers.Builder,
  bodyType: ReqPayload,
  bodyOffset: flatbuffers.Offset
): Uint8Array {
  RequestEnv.startRequestEnv(b);
  RequestEnv.addBodyType(b, bodyType);
  RequestEnv.addBody(b, bodyOffset);
  const root = RequestEnv.endRequestEnv(b);
  RequestEnv.finishRequestEnvBuffer(b, root);
  return b.asUint8Array();
}

export function encodeSignInPhone(phoneNumber: string): Uint8Array {
  const b = new flatbuffers.Builder(256);
  const phoneOff = b.createString(phoneNumber);
  const body = SignInPhone.createSignInPhone(b, phoneOff);
  return finishRequest(b, ReqPayload.SignInPhone, body);
}

export function encodeVerifyOtp(input: { phoneNumber?: string; email?: string; otp: number }): Uint8Array {
  const b = new flatbuffers.Builder(256);
  const phoneOff = b.createString(input.phoneNumber ?? '');
  const emailOff = b.createString(input.email ?? '');
  const body = VerifyOtpBody.createVerifyOtpBody(b, phoneOff, emailOff, input.otp);
  return finishRequest(b, ReqPayload.VerifyOtpBody, body);
}

/** Phone login (`pinConfirm` empty) or register / set PIN (`pinConfirm` must match `pin`). */
export function encodePhonePin(input: { phoneNumber: string; pin: string; pinConfirm?: string }): Uint8Array {
  const b = new flatbuffers.Builder(256);
  const phoneOff = b.createString(input.phoneNumber);
  const pinOff = b.createString(input.pin);
  const confirmOff = b.createString(input.pinConfirm ?? '');
  const body = PhonePinBody.createPhonePinBody(b, phoneOff, pinOff, confirmOff);
  return finishRequest(b, ReqPayload.PhonePinBody, body);
}

export function encodeGoogleAuth(input: { accessToken?: string; idToken?: string }): Uint8Array {
  const b = new flatbuffers.Builder(256);
  const accessOff = b.createString(input.accessToken ?? '');
  const idOff = b.createString(input.idToken ?? '');
  const body = GoogleAuthBody.createGoogleAuthBody(b, accessOff, idOff);
  return finishRequest(b, ReqPayload.GoogleAuthBody, body);
}

export interface CreatePostInput {
  payWaterBills: boolean;
  payElectricityBills: boolean;
  payForTrash: boolean;
  hasParking: boolean;
  requiredFirstMonthsPaid: number;
  units: string;
  isNegotiable: boolean;
  reviewDisclaimerAgreed: boolean;
  type: string;
  price: { currency: string; amount: number };
  location: { lat: number; lon: number; name: string };
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  images: string[];
  amenities: string;
}

export function encodeCreatePost(input: CreatePostInput): Uint8Array {
  const b = new flatbuffers.Builder(4096);
  const amenitiesOff = b.createString(input.amenities ?? '');
  const toiletsOff = b.createString(input.toilets);
  const bathroomsOff = b.createString(input.bathrooms);
  const bedroomsOff = b.createString(input.bedrooms);
  const typeOff = b.createString(input.type);
  const unitsOff = b.createString(input.units);
  const curOff = b.createString(input.price.currency);
  const priceOff = Price.createPrice(b, curOff, input.price.amount);
  const locNameOff = b.createString(input.location.name);
  const locOff = Location.createLocation(b, input.location.lat, input.location.lon, locNameOff);
  const imgOffs = input.images.map((s) => b.createString(s));
  const imgVec = CreatePostBody.createImagesVector(b, imgOffs);
  CreatePostBody.startCreatePostBody(b);
  CreatePostBody.addPayWaterBills(b, input.payWaterBills);
  CreatePostBody.addPayElectricityBills(b, input.payElectricityBills);
  CreatePostBody.addPayForTrash(b, input.payForTrash);
  CreatePostBody.addHasParking(b, input.hasParking);
  CreatePostBody.addRequiredFirstMonthsPaid(b, input.requiredFirstMonthsPaid);
  CreatePostBody.addUnits(b, unitsOff);
  CreatePostBody.addIsNegotiable(b, input.isNegotiable);
  CreatePostBody.addReviewDisclaimerAgreed(b, input.reviewDisclaimerAgreed);
  CreatePostBody.addType(b, typeOff);
  CreatePostBody.addPrice(b, priceOff);
  CreatePostBody.addLocation(b, locOff);
  CreatePostBody.addBedrooms(b, bedroomsOff);
  CreatePostBody.addBathrooms(b, bathroomsOff);
  CreatePostBody.addToilets(b, toiletsOff);
  CreatePostBody.addImages(b, imgVec);
  CreatePostBody.addAmenities(b, amenitiesOff);
  const body = CreatePostBody.endCreatePostBody(b);
  return finishRequest(b, ReqPayload.CreatePostBody, body);
}

export interface UpdateProfileInput {
  id: number;
  username?: string;
  photo?: string;
  showContactSet?: boolean;
  showContact?: boolean;
  isBrokerSet?: boolean;
  isBroker?: boolean;
  brokerFeesSet?: boolean;
  brokerFees?: string;
  acceptedPsSet?: boolean;
  acceptedPs?: boolean;
}

export function encodeUpdateProfile(p: UpdateProfileInput): Uint8Array {
  const b = new flatbuffers.Builder(512);
  const usernameOff = b.createString(p.username ?? '');
  const photoOff = b.createString(p.photo ?? '');
  const feesOff = b.createString(p.brokerFees ?? '');
  const body = UpdateProfileBody.createUpdateProfileBody(
    b,
    p.id,
    usernameOff,
    photoOff,
    !!p.showContactSet,
    !!p.showContact,
    !!p.isBrokerSet,
    !!p.isBroker,
    !!p.brokerFeesSet,
    feesOff,
    !!p.acceptedPsSet,
    !!p.acceptedPs
  );
  return finishRequest(b, ReqPayload.UpdateProfileBody, body);
}

export function encodeBlock(blockedUserId: number, blocked: boolean): Uint8Array {
  const b = new flatbuffers.Builder(128);
  const body = BlockBody.createBlockBody(b, blockedUserId, blocked);
  return finishRequest(b, ReqPayload.BlockBody, body);
}

export function encodeReport(reportedId: number, reason: string): Uint8Array {
  const b = new flatbuffers.Builder(256);
  const reasonOff = b.createString(reason);
  const body = ReportBody.createReportBody(b, reportedId, reasonOff);
  return finishRequest(b, ReqPayload.ReportBody, body);
}

export function encodeRoomId(roomId: number): Uint8Array {
  const b = new flatbuffers.Builder(128);
  const body = RoomIdBody.createRoomIdBody(b, roomId);
  return finishRequest(b, ReqPayload.RoomIdBody, body);
}

export function encodePostId(postId: number): Uint8Array {
  const b = new flatbuffers.Builder(128);
  const body = PostIdBody.createPostIdBody(b, postId);
  return finishRequest(b, ReqPayload.PostIdBody, body);
}

export function encodeApprovePost(postId: number): Uint8Array {
  const b = new flatbuffers.Builder(128);
  const body = ApprovePostBody.createApprovePostBody(b, postId);
  return finishRequest(b, ReqPayload.ApprovePostBody, body);
}

export function encodeApproveUser(userId: number): Uint8Array {
  const b = new flatbuffers.Builder(128);
  const body = ApproveUserBody.createApproveUserBody(b, userId);
  return finishRequest(b, ReqPayload.ApproveUserBody, body);
}

export function encodeUpdateId(id: number, type: string, value: string): Uint8Array {
  const b = new flatbuffers.Builder(256);
  const typeOff = b.createString(type);
  const valueOff = b.createString(value);
  const body = UpdateIdBody.createUpdateIdBody(b, id, typeOff, valueOff);
  return finishRequest(b, ReqPayload.UpdateIdBody, body);
}

/** For POST bodies with no fields (e.g. last-seen). */
export function encodeEmptyReq(): Uint8Array {
  const b = new flatbuffers.Builder(128);
  const body = EmptyReq.createEmptyReq(b);
  return finishRequest(b, ReqPayload.EmptyReq, body);
}
