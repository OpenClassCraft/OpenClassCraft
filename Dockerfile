# syntax=docker/dockerfile:1
# check=error=true

ARG DOCKER_IMAGE=alpine:3.24
FROM $DOCKER_IMAGE AS dev

ENV LUAJIT_VERSION=v2.1

RUN apk add --no-cache git build-base cmake curl-dev zlib-dev zstd-dev \
		sqlite-dev postgresql-dev hiredis-dev leveldb-dev \
		gmp-dev jsoncpp-dev ninja

WORKDIR /usr/src/

ADD https://github.com/jupp0r/prometheus-cpp.git?branch=master /usr/src/prometheus-cpp
ADD https://github.com/libspatialindex/libspatialindex.git?branch=main /usr/src/libspatialindex
ADD --keep-git-dir https://luajit.org/git/luajit.git?branch=${LUAJIT_VERSION} /usr/src/luajit

RUN cd prometheus-cpp && \
		cmake -B build \
			-DCMAKE_INSTALL_PREFIX=/usr/local \
			-DCMAKE_BUILD_TYPE=Release \
			-DENABLE_TESTING=0 \
			-GNinja && \
		cmake --build build && \
		cmake --install build && \
		cd /usr/src/ && \
	cd libspatialindex && \
		cmake -B build \
			-DCMAKE_INSTALL_PREFIX=/usr/local && \
		cmake --build build && \
		cmake --install build && \
		cd /usr/src/ && \
	cd luajit && \
		make amalg && make install && \
	cd /usr/src/

FROM dev AS builder

COPY .git /usr/src/openclasscraft/.git
COPY CMakeLists.txt /usr/src/openclasscraft/CMakeLists.txt
COPY README.md /usr/src/openclasscraft/README.md
COPY LICENSE.txt /usr/src/openclasscraft/LICENSE.txt
COPY COPYING.LESSER /usr/src/openclasscraft/COPYING.LESSER
COPY minetest.conf.example /usr/src/openclasscraft/minetest.conf.example
COPY builtin /usr/src/openclasscraft/builtin
COPY cmake /usr/src/openclasscraft/cmake
COPY client /usr/src/openclasscraft/client
COPY doc /usr/src/openclasscraft/doc
COPY fonts /usr/src/openclasscraft/fonts
COPY games /usr/src/openclasscraft/games
COPY lib /usr/src/openclasscraft/lib
COPY misc /usr/src/openclasscraft/misc
COPY po /usr/src/openclasscraft/po
COPY src /usr/src/openclasscraft/src
COPY irr /usr/src/openclasscraft/irr
COPY textures /usr/src/openclasscraft/textures

WORKDIR /usr/src/openclasscraft
RUN cmake -B build \
		-DCMAKE_INSTALL_PREFIX=/usr/local \
		-DCMAKE_BUILD_TYPE=Release \
		-DBUILD_SERVER=TRUE \
		-DENABLE_PROMETHEUS=TRUE \
		-DBUILD_UNITTESTS=FALSE -DBUILD_BENCHMARKS=FALSE \
		-DBUILD_CLIENT=FALSE \
		-GNinja && \
	cmake --build build && \
	cmake --install build

FROM $DOCKER_IMAGE AS runtime

RUN apk add --no-cache curl gmp libstdc++ libgcc libpq jsoncpp zstd-libs \
				sqlite-libs postgresql hiredis leveldb && \
	adduser -D openclasscraft --uid 30000 -h /var/lib/openclasscraft && \
	mkdir -p /etc/openclasscraft && \
	chown -R openclasscraft:openclasscraft /var/lib/openclasscraft

WORKDIR /var/lib/openclasscraft

COPY --from=builder /usr/local/share/openclasscraft /usr/local/share/openclasscraft
COPY --from=builder /usr/local/bin/openclasscraftserver /usr/local/bin/openclasscraftserver
COPY --from=builder /usr/local/share/doc/openclasscraft/minetest.conf.example /etc/openclasscraft/openclasscraft.conf
COPY --from=builder /usr/local/lib/libspatialindex* /usr/local/lib/
COPY --from=builder /usr/local/lib/libluajit* /usr/local/lib/
USER openclasscraft:openclasscraft

EXPOSE 30000/udp 30000/tcp
VOLUME /var/lib/openclasscraft/ /etc/openclasscraft/

ENTRYPOINT ["/usr/local/bin/openclasscraftserver"]
CMD ["--config", "/etc/openclasscraft/openclasscraft.conf"]
