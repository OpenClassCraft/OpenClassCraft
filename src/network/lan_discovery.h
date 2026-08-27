// OpenClassCraft
// SPDX-License-Identifier: LGPL-2.1-or-later

#pragma once

#include "irrlichttypes.h"
#include "threading/thread.h"

#include <string>
#include <string_view>
#include <vector>

constexpr u16 LAN_DISCOVERY_PORT = 29999;

struct LanDiscoveryInfo
{
	u16 port = 0;
	u16 protocol_min = 0;
	u16 protocol_max = 0;
	bool password_required = false;
	std::string name;
	std::string gameid;
};

struct DiscoveredLanServer
{
	std::string address;
	LanDiscoveryInfo info;
};

std::string makeLanDiscoveryRequest();
bool isLanDiscoveryRequest(std::string_view packet);
std::string makeLanDiscoveryResponse(const LanDiscoveryInfo &info);
bool parseLanDiscoveryResponse(std::string_view packet, LanDiscoveryInfo *info);

std::vector<DiscoveredLanServer> discoverLanServers(u32 timeout_ms);

class LanDiscoveryResponder final : public Thread
{
public:
	explicit LanDiscoveryResponder(LanDiscoveryInfo info);
	~LanDiscoveryResponder() override;

private:
	void *run() override;

	LanDiscoveryInfo m_info;
};
