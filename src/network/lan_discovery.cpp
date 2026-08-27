// OpenClassCraft
// SPDX-License-Identifier: LGPL-2.1-or-later

#include "lan_discovery.h"

#include "address.h"
#include "log.h"
#include "networkexceptions.h"
#include "socket.h"
#include "util/serialize.h"

#include <algorithm>
#include <chrono>
#include <cstring>
#include <set>

namespace {

constexpr char REQUEST_MAGIC[] = "OCCLAN?1";
constexpr char RESPONSE_MAGIC[] = "OCCLAN!1";
constexpr size_t MAGIC_SIZE = sizeof(REQUEST_MAGIC) - 1;
constexpr size_t RESPONSE_HEADER_SIZE = MAGIC_SIZE + 2 + 2 + 2 + 1 + 2 + 2;
constexpr size_t MAX_DISCOVERY_TEXT_LENGTH = 255;
constexpr size_t MAX_DISCOVERED_SERVERS = 64;

std::string boundedText(const std::string &value)
{
	std::string result = value.substr(0, MAX_DISCOVERY_TEXT_LENGTH);
	for (char &character : result) {
		if (static_cast<unsigned char>(character) < 0x20)
			character = ' ';
	}
	return result;
}

} // namespace

std::string makeLanDiscoveryRequest()
{
	return std::string(REQUEST_MAGIC, MAGIC_SIZE);
}

bool isLanDiscoveryRequest(std::string_view packet)
{
	return packet.size() == MAGIC_SIZE &&
		memcmp(packet.data(), REQUEST_MAGIC, MAGIC_SIZE) == 0;
}

std::string makeLanDiscoveryResponse(const LanDiscoveryInfo &info)
{
	const std::string name = boundedText(info.name);
	const std::string gameid = boundedText(info.gameid);
	std::string packet(RESPONSE_HEADER_SIZE + name.size() + gameid.size(), '\0');
	memcpy(packet.data(), RESPONSE_MAGIC, MAGIC_SIZE);
	writeU16(reinterpret_cast<u8 *>(packet.data() + MAGIC_SIZE), info.port);
	writeU16(reinterpret_cast<u8 *>(packet.data() + MAGIC_SIZE + 2), info.protocol_min);
	writeU16(reinterpret_cast<u8 *>(packet.data() + MAGIC_SIZE + 4), info.protocol_max);
	packet[MAGIC_SIZE + 6] = info.password_required ? 1 : 0;
	writeU16(reinterpret_cast<u8 *>(packet.data() + MAGIC_SIZE + 7), name.size());
	writeU16(reinterpret_cast<u8 *>(packet.data() + MAGIC_SIZE + 9), gameid.size());
	memcpy(packet.data() + RESPONSE_HEADER_SIZE, name.data(), name.size());
	memcpy(packet.data() + RESPONSE_HEADER_SIZE + name.size(), gameid.data(), gameid.size());
	return packet;
}

bool parseLanDiscoveryResponse(std::string_view packet, LanDiscoveryInfo *info)
{
	if (!info || packet.size() < RESPONSE_HEADER_SIZE ||
			memcmp(packet.data(), RESPONSE_MAGIC, MAGIC_SIZE) != 0)
		return false;

	const auto *data = reinterpret_cast<const u8 *>(packet.data());
	LanDiscoveryInfo parsed;
	parsed.port = readU16(data + MAGIC_SIZE);
	parsed.protocol_min = readU16(data + MAGIC_SIZE + 2);
	parsed.protocol_max = readU16(data + MAGIC_SIZE + 4);
	parsed.password_required = data[MAGIC_SIZE + 6] != 0;
	const u16 name_length = readU16(data + MAGIC_SIZE + 7);
	const u16 gameid_length = readU16(data + MAGIC_SIZE + 9);
	const size_t expected_size = RESPONSE_HEADER_SIZE + name_length + gameid_length;

	if (parsed.port == 0 || parsed.protocol_min > parsed.protocol_max ||
			name_length > MAX_DISCOVERY_TEXT_LENGTH ||
			gameid_length > MAX_DISCOVERY_TEXT_LENGTH || packet.size() != expected_size)
		return false;

	parsed.name.assign(packet.data() + RESPONSE_HEADER_SIZE, name_length);
	parsed.gameid.assign(packet.data() + RESPONSE_HEADER_SIZE + name_length,
			gameid_length);
	*info = std::move(parsed);
	return true;
}

std::vector<DiscoveredLanServer> discoverLanServers(u32 timeout_ms)
{
	std::vector<DiscoveredLanServer> result;
	timeout_ms = std::clamp(timeout_ms, 50U, 2000U);

	try {
		UDPSocket socket(false);
		socket.setBroadcast(true);
		socket.Bind(Address(0, 0, 0, 0, 0));
		const std::string request = makeLanDiscoveryRequest();

		// The limited broadcast reaches the classroom subnet. Loopback makes
		// discovery work when a teacher tests host and join on one computer.
		for (const Address &destination : {
				Address(255, 255, 255, 255, LAN_DISCOVERY_PORT),
				Address(127, 0, 0, 1, LAN_DISCOVERY_PORT)}) {
			try {
				socket.Send(destination, request.data(), request.size());
			} catch (const SendFailedException &) {
				// One route may be unavailable; keep trying the other route and
				// collect any replies that are already on the socket.
			}
		}

		const auto deadline = std::chrono::steady_clock::now() +
				std::chrono::milliseconds(timeout_ms);
		std::set<std::string> seen;
		char buffer[1024];
		while (result.size() < MAX_DISCOVERED_SERVERS) {
			const auto now = std::chrono::steady_clock::now();
			if (now >= deadline)
				break;
			const auto remaining = std::chrono::duration_cast<std::chrono::milliseconds>(
					deadline - now).count();
			socket.setTimeoutMs(static_cast<int>(std::min<long long>(remaining, 100)));

			Address sender;
			const int received = socket.Receive(sender, buffer, sizeof(buffer));
			if (received < 0)
				continue;

			LanDiscoveryInfo info;
			if (!parseLanDiscoveryResponse(std::string_view(buffer, received), &info))
				continue;
			const std::string address = sender.serializeString();
			const std::string key = address + ":" + std::to_string(info.port);
			if (!seen.insert(key).second)
				continue;
			result.push_back({address, std::move(info)});
		}
	} catch (const SocketException &e) {
		warningstream << "LAN discovery failed: " << e.what() << std::endl;
	}

	return result;
}

LanDiscoveryResponder::LanDiscoveryResponder(LanDiscoveryInfo info) :
	Thread("LanDiscovery"),
	m_info(std::move(info))
{
}

LanDiscoveryResponder::~LanDiscoveryResponder()
{
	stop();
	wait();
}

void *LanDiscoveryResponder::run()
{
	try {
		UDPSocket socket(false);
		socket.setTimeoutMs(200);
		socket.Bind(Address(0, 0, 0, 0, LAN_DISCOVERY_PORT));
		const std::string response = makeLanDiscoveryResponse(m_info);
		char buffer[128];

		infostream << "LAN discovery listening on UDP port " << LAN_DISCOVERY_PORT
				<< std::endl;
		while (!stopRequested()) {
			Address sender;
			const int received = socket.Receive(sender, buffer, sizeof(buffer));
			if (received < 0 || !isLanDiscoveryRequest(
						std::string_view(buffer, received)))
				continue;
			try {
				socket.Send(sender, response.data(), response.size());
			} catch (const SendFailedException &e) {
				verbosestream << "Could not answer LAN discovery request: "
						<< e.what() << std::endl;
			}
		}
	} catch (const SocketException &e) {
		warningstream << "LAN discovery responder is unavailable: " << e.what()
				<< std::endl;
	}
	return nullptr;
}
