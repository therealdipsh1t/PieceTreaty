// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title PieceTreatyFilings
/// @notice ERC-1155 title deeds for chase cards. In-game catalog stays off-chain.
///         `cardId` is the game's catalog id. Only registered chase cards can be filed.
///         The game backend (MINTER_ROLE) files copies a player already owns in-game.
contract PieceTreatyFilings is ERC1155, ERC1155Supply, AccessControl, Ownable, ReentrancyGuard {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct Card {
        string name;
        bool registered;
        bool chase;
        uint256 maxSupply; // 0 = unlimited
        string metadataURI; // full token URI; empty → baseURI + id
    }

    mapping(uint256 => Card) private _cards;
    uint256[] public registeredIds;

    event CardRegistered(uint256 indexed cardId, string name, bool chase, uint256 maxSupply);
    event CardUpdated(uint256 indexed cardId);
    event Filed(uint256 indexed cardId, address indexed to, uint256 amount);
    event Unfiled(uint256 indexed cardId, address indexed from, uint256 amount);

    constructor(address initialOwner, string memory baseURI_) ERC1155(baseURI_) Ownable(initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
    }

    // ─────────────────────────────────────────────
    // Catalog (owner)
    // ─────────────────────────────────────────────

    function registerCard(
        uint256 cardId,
        string calldata name_,
        bool chase_,
        uint256 maxSupply_,
        string calldata metadataURI_
    ) external onlyOwner {
        require(cardId > 0, "cardId=0");
        require(bytes(name_).length > 0, "empty name");
        Card storage c = _cards[cardId];
        if (!c.registered) {
            registeredIds.push(cardId);
        }
        c.name = name_;
        c.registered = true;
        c.chase = chase_;
        c.maxSupply = maxSupply_;
        c.metadataURI = metadataURI_;
        emit CardRegistered(cardId, name_, chase_, maxSupply_);
    }

    function setCardChase(uint256 cardId, bool chase_) external onlyOwner {
        Card storage c = _requireCard(cardId);
        c.chase = chase_;
        emit CardUpdated(cardId);
    }

    function setCardURI(uint256 cardId, string calldata metadataURI_) external onlyOwner {
        Card storage c = _requireCard(cardId);
        c.metadataURI = metadataURI_;
        emit CardUpdated(cardId);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _setURI(baseURI_);
    }

    function setMinter(address account, bool enabled) external onlyOwner {
        if (enabled) _grantRole(MINTER_ROLE, account);
        else _revokeRole(MINTER_ROLE, account);
    }

    // ─────────────────────────────────────────────
    // Filing (game backend)
    // ─────────────────────────────────────────────

    /// @notice Mint title deeds for copies the player already holds in-game.
    function file(address to, uint256 cardId, uint256 amount) external onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0), "zero address");
        require(amount > 0, "amount=0");
        Card storage c = _requireCard(cardId);
        require(c.chase, "not chase");
        if (c.maxSupply > 0) {
            require(totalSupply(cardId) + amount <= c.maxSupply, "supply cap");
        }
        _mint(to, cardId, amount, "");
        emit Filed(cardId, to, amount);
    }

    /// @notice Return a filed copy to in-game-only inventory. Minter or holder.
    function unfile(address from, uint256 cardId, uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        require(from != address(0), "zero address");
        require(msg.sender == from || hasRole(MINTER_ROLE, msg.sender), "not allowed");
        _burn(from, cardId, amount);
        emit Unfiled(cardId, from, amount);
    }

    // ─────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────

    function getCard(uint256 cardId)
        external
        view
        returns (string memory name_, bool registered_, bool chase_, uint256 maxSupply_, uint256 filed_, string memory metadataURI_)
    {
        Card storage c = _cards[cardId];
        return (c.name, c.registered, c.chase, c.maxSupply, totalSupply(cardId), c.metadataURI);
    }

    function registeredCount() external view returns (uint256) {
        return registeredIds.length;
    }

    function uri(uint256 cardId) public view override returns (string memory) {
        Card storage c = _cards[cardId];
        if (bytes(c.metadataURI).length > 0) {
            return c.metadataURI;
        }
        string memory base = super.uri(cardId);
        if (bytes(base).length == 0) {
            return "";
        }
        return string(abi.encodePacked(base, cardId.toString(), ".json"));
    }

    // ─────────────────────────────────────────────
    // OZ overrides
    // ─────────────────────────────────────────────

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _requireCard(uint256 cardId) internal view returns (Card storage c) {
        c = _cards[cardId];
        require(c.registered, "unknown card");
    }
}
