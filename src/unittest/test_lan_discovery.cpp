// OpenClassCraft
// SPDX-License-Identifier: LGPL-2.1-or-later

#include "test.h"

#include "network/lan_discovery.h"

#include <algorithm>

class TestLanDiscovery : public TestBase
{
public:
	TestLanDiscovery() { TestManager::registerTestModule(this); }
	const char *getName() override { return "TestLanDiscovery"; }

	void runTests(IGameDef *gamedef) override;
	void testRequest();
	void testResponseRoundTrip();
	void testMalformedResponses();
	void testLoopbackDiscovery();
};

static TestLanDiscovery g_test_instance;

void TestLanDiscovery::runTests(IGameDef *gamedef)
{
	TEST(testRequest);
	TEST(testResponseRoundTrip);
	TEST(testMalformedResponses);
	TEST(testLoopbackDiscovery);
}

void TestLanDiscovery::testRequest()
{
	const std::string request = makeLanDiscoveryRequest();
	UASSERT(isLanDiscoveryRequest(request));
	UASSERT(!isLanDiscoveryRequest(""));
	UASSERT(!isLanDiscoveryRequest(request + "x"));
	UASSERT(!isLanDiscoveryRequest("OCCLAN!1"));
}

void TestLanDiscovery::testResponseRoundTrip()
{
	LanDiscoveryInfo source;
	source.port = 31085;
	source.protocol_min = 37;
	source.protocol_max = 48;
	source.password_required = true;
	source.name = "Room 7 Coding World";
	source.gameid = "luanti_edu";

	LanDiscoveryInfo parsed;
	UASSERT(parseLanDiscoveryResponse(makeLanDiscoveryResponse(source), &parsed));
	UASSERTEQ(u16, parsed.port, source.port);
	UASSERTEQ(u16, parsed.protocol_min, source.protocol_min);
	UASSERTEQ(u16, parsed.protocol_max, source.protocol_max);
	UASSERT(parsed.password_required);
	UASSERTEQ(std::string, parsed.name, source.name);
	UASSERTEQ(std::string, parsed.gameid, source.gameid);
}

void TestLanDiscovery::testMalformedResponses()
{
	LanDiscoveryInfo source;
	source.port = 30000;
	source.protocol_min = 37;
	source.protocol_max = 48;
	source.name = "Classroom";
	source.gameid = "luanti_edu";
	const std::string valid = makeLanDiscoveryResponse(source);
	LanDiscoveryInfo parsed;

	UASSERT(!parseLanDiscoveryResponse("", &parsed));
	UASSERT(!parseLanDiscoveryResponse(valid.substr(0, valid.size() - 1), &parsed));
	UASSERT(!parseLanDiscoveryResponse(valid + "unexpected", &parsed));
	UASSERT(!parseLanDiscoveryResponse(valid, nullptr));

	source.port = 0;
	UASSERT(!parseLanDiscoveryResponse(makeLanDiscoveryResponse(source), &parsed));
	source.port = 30000;
	source.protocol_min = 49;
	source.protocol_max = 48;
	UASSERT(!parseLanDiscoveryResponse(makeLanDiscoveryResponse(source), &parsed));
}

void TestLanDiscovery::testLoopbackDiscovery()
{
	LanDiscoveryInfo source;
	source.port = 31086;
	source.protocol_min = 37;
	source.protocol_max = 52;
	source.name = "Loopback Classroom";
	source.gameid = "luanti_edu";

	LanDiscoveryResponder responder(source);
	responder.start();

	// The responder owns its socket inside the worker thread. Retry briefly so
	// a heavily loaded CI runner cannot make the test depend on thread startup
	// winning a one-shot race.
	for (u32 attempt = 0; attempt < 3; ++attempt) {
		sleep_ms(50);
		const auto discovered = discoverLanServers(250);
		const auto match = std::find_if(discovered.begin(), discovered.end(),
				[&source](const DiscoveredLanServer &server) {
					return server.info.port == source.port &&
						server.info.protocol_min == source.protocol_min &&
						server.info.protocol_max == source.protocol_max &&
						server.info.name == source.name &&
						server.info.gameid == source.gameid;
				});
		if (match != discovered.end())
			return;
	}
	UASSERT(false);
}
