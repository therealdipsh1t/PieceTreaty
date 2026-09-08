// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title LegallyMimeNFT
/// @notice Multi-series ERC-721 collection on Monad. Owner can open new series
///         with independent supply, price, per-wallet limits, and metadata base URI.
contract LegallyMimeNFT is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    using Strings for uint256;

    struct Series {
        string name;
        string baseURI;
        uint256 maxSupply;
        uint256 minted;
        uint256 mintPrice; // wei (native MON)
        uint256 maxPerWallet; // 0 = unlimited
        bool active;
        bool exists;
    }

    uint256 public nextTokenId = 1;
    uint256 public nextSeriesId = 1;

    mapping(uint256 => Series) private _series;
    mapping(uint256 => uint256) public tokenSeries; // tokenId => seriesId
    mapping(uint256 => mapping(address => uint256)) public mintedPerWallet; // seriesId => wallet => count

    event SeriesCreated(
        uint256 indexed seriesId,
        string name,
        uint256 maxSupply,
        uint256 mintPrice,
        uint256 maxPerWallet,
        bool active
    );
    event SeriesUpdated(uint256 indexed seriesId);
    event Minted(uint256 indexed seriesId, address indexed to, uint256 indexed tokenId, uint256 pricePaid);

    constructor(address initialOwner) ERC721("Legally Mime", "LMIME") Ownable(initialOwner) {}

    // ─────────────────────────────────────────────
    // Series admin
    // ─────────────────────────────────────────────

    function createSeries(
        string calldata name_,
        string calldata baseURI_,
        uint256 maxSupply_,
        uint256 mintPrice_,
        uint256 maxPerWallet_,
        bool active_
    ) external onlyOwner returns (uint256 seriesId) {
        require(bytes(name_).length > 0, "empty name");
        require(maxSupply_ > 0, "maxSupply=0");

        seriesId = nextSeriesId++;
        _series[seriesId] = Series({
            name: name_,
            baseURI: baseURI_,
            maxSupply: maxSupply_,
            minted: 0,
            mintPrice: mintPrice_,
            maxPerWallet: maxPerWallet_,
            active: active_,
            exists: true
        });

        emit SeriesCreated(seriesId, name_, maxSupply_, mintPrice_, maxPerWallet_, active_);
    }

    function setSeriesActive(uint256 seriesId, bool active_) external onlyOwner {
        Series storage s = _requireSeries(seriesId);
        s.active = active_;
        emit SeriesUpdated(seriesId);
    }

    function setSeriesMintPrice(uint256 seriesId, uint256 mintPrice_) external onlyOwner {
        Series storage s = _requireSeries(seriesId);
        s.mintPrice = mintPrice_;
        emit SeriesUpdated(seriesId);
    }

    function setSeriesBaseURI(uint256 seriesId, string calldata baseURI_) external onlyOwner {
        Series storage s = _requireSeries(seriesId);
        s.baseURI = baseURI_;
        emit SeriesUpdated(seriesId);
    }

    function setSeriesMaxPerWallet(uint256 seriesId, uint256 maxPerWallet_) external onlyOwner {
        Series storage s = _requireSeries(seriesId);
        s.maxPerWallet = maxPerWallet_;
        emit SeriesUpdated(seriesId);
    }

    function setSeriesName(uint256 seriesId, string calldata name_) external onlyOwner {
        require(bytes(name_).length > 0, "empty name");
        Series storage s = _requireSeries(seriesId);
        s.name = name_;
        emit SeriesUpdated(seriesId);
    }

    // ─────────────────────────────────────────────
    // Minting
    // ─────────────────────────────────────────────

    /// @notice Public mint for an active series. Pays mintPrice * quantity in native MON.
    function mint(uint256 seriesId, uint256 quantity) external payable nonReentrant {
        Series storage s = _requireSeries(seriesId);
        require(s.active, "series inactive");
        require(quantity > 0, "qty=0");
        require(s.minted + quantity <= s.maxSupply, "sold out");

        if (s.maxPerWallet > 0) {
            require(mintedPerWallet[seriesId][msg.sender] + quantity <= s.maxPerWallet, "wallet limit");
        }

        uint256 cost = s.mintPrice * quantity;
        require(msg.value >= cost, "insufficient payment");

        mintedPerWallet[seriesId][msg.sender] += quantity;
        _mintBatch(seriesId, msg.sender, quantity, s.mintPrice);

        if (msg.value > cost) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - cost}("");
            require(ok, "refund failed");
        }
    }

    /// @notice Owner mint / airdrop (does not require payment or series.active).
    function ownerMint(uint256 seriesId, address to, uint256 quantity) external onlyOwner {
        Series storage s = _requireSeries(seriesId);
        require(to != address(0), "zero address");
        require(quantity > 0, "qty=0");
        require(s.minted + quantity <= s.maxSupply, "sold out");
        _mintBatch(seriesId, to, quantity, 0);
    }

    function _mintBatch(uint256 seriesId, address to, uint256 quantity, uint256 priceEach) internal {
        Series storage s = _series[seriesId];
        for (uint256 i = 0; i < quantity; ) {
            uint256 tokenId = nextTokenId;
            unchecked {
                nextTokenId = tokenId + 1;
                s.minted += 1;
                ++i;
            }
            tokenSeries[tokenId] = seriesId;
            _safeMint(to, tokenId);
            emit Minted(seriesId, to, tokenId, priceEach);
        }
    }

    // ─────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────

    function getSeries(uint256 seriesId)
        external
        view
        returns (
            string memory name_,
            string memory baseURI_,
            uint256 maxSupply_,
            uint256 minted_,
            uint256 mintPrice_,
            uint256 maxPerWallet_,
            bool active_,
            bool exists_
        )
    {
        Series storage s = _series[seriesId];
        return (s.name, s.baseURI, s.maxSupply, s.minted, s.mintPrice, s.maxPerWallet, s.active, s.exists);
    }

    function seriesCount() external view returns (uint256) {
        return nextSeriesId - 1;
    }

    function remainingSupply(uint256 seriesId) external view returns (uint256) {
        Series storage s = _requireSeries(seriesId);
        return s.maxSupply - s.minted;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 seriesId = tokenSeries[tokenId];
        string memory base = _series[seriesId].baseURI;
        if (bytes(base).length == 0) {
            return "";
        }
        // Convention: baseURI should end with /  →  ipfs://CID/123.json
        return string(abi.encodePacked(base, tokenId.toString(), ".json"));
    }

    // ─────────────────────────────────────────────
    // Treasury
    // ─────────────────────────────────────────────

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "empty");
        (bool ok, ) = payable(owner()).call{value: bal}("");
        require(ok, "withdraw failed");
    }

    // ─────────────────────────────────────────────
    // Internals / OZ overrides
    // ─────────────────────────────────────────────

    function _requireSeries(uint256 seriesId) internal view returns (Series storage s) {
        s = _series[seriesId];
        require(s.exists, "series missing");
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
