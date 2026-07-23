const fs = require('fs');

const myId = "cmrrx2f89000fsacri6emf9a7";
const peerId = "cmrrx1nob0005sacrkwqhqg6d";

const u = {
  id: "cmrrx...contactId",
  requesterId: myId,
  addresseeId: peerId,
  isFavourite: true,
  contact: { id: myId, profile: { displayName: "Me" } },
  addressee: { id: peerId, profile: { displayName: "Them" } }
};

let targetUserId = "";
let targetProfile = null;
let targetPhone = "";

if (u.requesterId && u.addresseeId) {
  if (myId && u.requesterId === myId) {
    targetUserId = u.addresseeId;
    targetProfile = u.addressee?.profile;
    targetPhone = u.addressee?.phone;
  } else if (myId && u.addresseeId === myId) {
    targetUserId = u.requesterId;
    targetProfile = u.contact?.profile;
    targetPhone = u.contact?.phone;
  }
}

console.log("targetUserId:", targetUserId);
console.log("matches peerId?", targetUserId === peerId);

