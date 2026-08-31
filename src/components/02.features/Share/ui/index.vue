<script setup lang="ts">
import { useShareStore } from '../model/index'

const store = useShareStore()
function setRendererRef(el: any) {
  store.rendererRef = el as HTMLElement | null
}
</script>

<template>
  <div
    v-if="store.shareData"
    class="share-wrapper"
  >
    <div
      :ref="setRendererRef"
      class="share-card"
    >
      <img
        :src="store.mapScreenshot"
        class="bg-map"
      >
      <div class="overlay-gradient" />

      <div class="card-content">
        <div class="header">
          <div class="badge">
            LOCATION MARK
          </div>
        </div>

        <div class="center-marker">
          <div class="custom-marker">
            <div class="marker-circle">
              <img
                v-if="store.shareData.markImg"
                :src="store.shareData.markImg"
                crossorigin="anonymous"
                class="marker-avatar"
              >
              <svg
                v-else
                class="marker-avatar marker-avatar--empty"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                  fill="#3399ff"
                />
              </svg>
            </div>
            <div class="marker-arrow" />
          </div>
        </div>

        <div class="footer">
          <h2 class="title">
            {{ store.shareData.title }}
          </h2>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.share-wrapper {
  position: fixed;
  left: -2000px;
  top: 0;
  z-index: -1;
}
.share-card {
  width: 500px;
  height: 500px;
  position: relative;
  border-radius: 40px;
  overflow: hidden;
  background: #000;
  display: flex;
  flex-direction: column;

  .bg-map {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .overlay-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.9) 100%);
  }
  .card-content {
    position: relative;
    z-index: 10;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px;
    box-sizing: border-box;
  }
}

.center-marker {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
}

.marker-circle {
  width: 80px;
  height: 80px;
  background: #fff;
  border-radius: 50%;
  padding: 3px;
  box-sizing: border-box;
  z-index: 2;

  .marker-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }

  .marker-avatar--empty {
    padding: 14px;
    box-sizing: border-box;
  }
}

.marker-arrow {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 12px solid #3399ff;
  margin-top: -2px;
  z-index: 1;
}

.badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 16px;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  width: max-content;
}

.title {
  color: #fff;
  font-size: 42px;
  font-weight: 900;
  margin: 0;
}
</style>
