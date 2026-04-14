import Array "mo:base/Array";
import Time "mo:base/Time";

persistent actor GroupChat {
  type Message = {
    id : Nat;
    name : Text;
    content : Text;
    timestamp : Int;
    color : Nat;
  };

  private var messages : [Message] = [];
  private var nameColors : [(Text, Nat)] = [];
  private var nextColor : Nat = 0;
  private let MAX_COLORS : Nat = 15;

  private func getColorForName(name : Text) : Nat {
    for ((n, c) in nameColors.vals()) {
      if (n == name) return c;
    };
    let color = nextColor % MAX_COLORS;
    nextColor += 1;
    nameColors := Array.append<(Text, Nat)>(nameColors, [(name, color)]);
    color;
  };

  public func sendMessage(name : Text, content : Text) : async Message {
    let msg : Message = {
      id = messages.size();
      name = name;
      content = content;
      timestamp = Time.now();
      color = getColorForName(name);
    };
    messages := Array.append<Message>(messages, [msg]);
    msg;
  };

  // Returns messages starting from the given id (inclusive).
  // Pass 0 to get all messages. Pass lastId + 1 to get only new ones.
  public query func getMessages(fromId : Nat) : async [Message] {
    if (fromId >= messages.size()) { return [] };
    Array.subArray<Message>(messages, fromId, messages.size() - fromId);
  };
};
